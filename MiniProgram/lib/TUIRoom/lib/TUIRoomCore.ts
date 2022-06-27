// @ts-ignore
import TIM from '../../tim-wx-sdk';
import Event from './emitter/event';
import {
  simpleClone,
} from './util';
import {
  TUISpeechMode,
  TUIRoomEvents,
  TRTCEvents,
} from './types';
import {
  TUIRoomErrorCode,
  TUIRoomErrorMessage,
} from './constant';
import TUIRoomUser from './base/TUIRoomUser';
import TUIRoomError from './base/TUIRoomError';
import TUIRoomResponse from './base/TUIRoomResponse';
import TUIRoomInfo from './base/TUIRoomInfo';
import TRTCService from './TRTCService';
import TIMService from './TIMService';
import ITUIRoomCore from './interface/ITUIRoomCore';
import ITUIRoomCoordinator from './interface/ITUIRoomCoordinator';
import TUIRoomCoordinator from './TUIRoomCoordinator';
import StateStore from './StateStore';
import TUIRoomLifecycle from './TUIRoomLifecycle';
import TUIRoomAuth from './TUIRoomAuth';
import TSignalingService from './TSignalingService';

class TUIRoomCore implements ITUIRoomCore, ITUIRoomCoordinator {
  static logPrefix = '[TUIRoomCore]';

  private static instance: TUIRoomCore | null;

  private state: StateStore;

  private trtcService: TRTCService;

  public timService: TIMService;

  private tsignalingService: TSignalingService;

  private roomCoordinator: TUIRoomCoordinator;

  private SDKAppID = 0;

  private userSig = '';

  public isLogin = false;

  public emitter = new Event();

  public tim: any;

  private roomLifecycle: TUIRoomLifecycle;

  private roomAuth: TUIRoomAuth;

  /**
   * 获取单例实例
   */
  public static getInstance(): TUIRoomCore {
    wx.setStorage({
      key: 'TUIScene',
      data: 'TUIRoom',
    });
    wx.TUIScene = 'TUIRoom';
    if (!TUIRoomCore.instance) {
      TUIRoomCore.instance = new TUIRoomCore();
    }
    return TUIRoomCore.instance;
  }

  /**
   * 销毁单例实例
   */
  public static destroyInstance() {
    if (TUIRoomCore.instance !== null) {
      TUIRoomCore.instance.destroy();
    }
  }

  private constructor() {
    this.state = new StateStore();
    this.timService = new TIMService();
    this.tsignalingService = new TSignalingService();
    this.roomAuth = new TUIRoomAuth(
      this.state,
      this.tsignalingService,
      this.timService,
    );
    this.roomLifecycle = new TUIRoomLifecycle(
      this.state,
      this.timService,
    );
    this.roomCoordinator = new TUIRoomCoordinator(
      this.state,
      this.tsignalingService,
    );


    this.onReceiveChatMessage = this.onReceiveChatMessage.bind(this);
    this.onReceiveCustomMessage = this.onReceiveCustomMessage.bind(this);
    this.onRoomDestroyed = this.onRoomDestroyed.bind(this);

    this.bindIMEvent();
    this.bindCoordinatorEvent();
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   内部工具、校验方法
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  private checkLogin() {
    if (!this.login) {
      throw new TUIRoomError(
        TUIRoomErrorCode.NOT_LOGIN,
        TUIRoomErrorMessage.NOT_LOGIN,
      );
    }
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   登录、登出接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 登录
   *
   * 主要是登录 TIM
   *
   * @param {number} SDKAppID - SDKAppID
   * @param {string} userID - 用户ID
   * @param {string} userSig - 用户签名
   * @returns {Promise}
   */
  async login(
    SDKAppID: number,
    userID: string,
    userSig: string,
  ): Promise<TUIRoomResponse<any>> {
    // 如果实例存在，先销毁
    if (this.tim && this.tim.destroy) {
      this.tim.destroy();
      this.tim = null;
    }
    this.tim = TIM.create({
      SDKAppID,
    });
    /**
     * TIM 与 TSignaling 一起使用时，需要通过 TSignaling 登录。
     *
     * 这里新建 TIM 实例后，传给 TIMService 和 TSignalingService 模块，供其内部使用；
     * TUIRoomAuth 向上层 TUIRoomCore 提供认证服务（登录、登出功能），向下依赖于
     * TSignalingService 实现登录、登出。
     */
    this.timService.init({
      SDKAppID,
      userID,
      userSig,
      tim: this.tim,
    });
    this.tsignalingService.init({
      SDKAppID,
      userID,
      userSig,
      tim: this.tim,
    });
    await this.roomAuth.login(userID, userSig);

    this.SDKAppID = SDKAppID;
    this.userSig = userSig;
    this.isLogin = true; // 同时 SDK is ready
    return TUIRoomResponse.success();
  }

  /**
   * 退出登录
   * @returns {Promise}
   */
  async logout(): Promise<TUIRoomResponse<null>> {
    await this.roomAuth.logout();
    this.isLogin = false;
    return TUIRoomResponse.success();
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   房间生命周期管理接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */

  /**
   * 设置房间的初始化配置
   * @param config - 初始化配置
   */
  setRoomConfig(config: {
    speechMode?: TUISpeechMode;
    isChatRoomMuted?: boolean;
    isAllCameraMuted?: boolean;
    isAllMicMuted?: boolean;
    startTime?: number;
  }) {
    this.state.roomInfo.roomConfig = Object.assign(
      this.state.roomInfo.roomConfig, {
        ...config,
      },
    );
  }

  /**
   * 创建房间
   *
   * 内部需要同时实现 TIM 建群和 TRTC 进房。
   * 如果 TIM 群已存在，且当前用户是群主，则加入群组；
   * 如果群组已存在，当前用户不是群主，提示房间号已被占用。
   * @param {string} roomID 房间号
   * @param {object} rtcConfig 进房参数
   * @param {TUISpeechMode} mode 发言模式，默认为“自由发言”模式
   * @returns {Promise}
   */
  async createRoom(
    roomID: string,
    rtcConfig: object = {},
    mode = TUISpeechMode.FREE_SPEECH,
  ): Promise<TUIRoomResponse<any>> {
    this.checkLogin();
    const tuiResponse = await this.roomLifecycle.createRoom({
      SDKAppID: this.SDKAppID,
      userID: this.state.currentUser.ID,
      userSig: this.userSig,
      roomID,
      rtcConfig,
      mode,
    });

    // 初始化 Room Coordinator
    this.roomCoordinator.init({
      roomID,
      tim: this.tim,
    });
    // 初始化房间控制参数（通过IM群公告实现）
    await this.roomCoordinator.setControlConfig(this.state.roomInfo.roomConfig);

    const {
      room,
      user,
    } = tuiResponse.data;
    this.emitter.emit(TUIRoomEvents.onUserEnterRoom, user);
    return TUIRoomResponse.success(room);
  }

  /**
   * 销毁房间
   *
   * 主持人销毁房间，内部需要同时实现 TIM 解散群和 TRTC 退房。观众端会收到房间销毁事件通知 onRoomDestroyed.
   * 需要先退出 TRTC 房间，再解散 TIM 群组。
   * @returns {Promise}
   */
  async destroyRoom(): Promise<TUIRoomResponse<any>> {
    this.checkLogin();
    const tuiResponse = await this.roomLifecycle.destroyRoom();
    this.tsignalingService.destroy();
    this.trtcService.destroy();
    return TUIRoomResponse.success();
  }

  /**
   * 进入房间
   *
   * 先加入 TIM 群组，再进入 TRTC 房间
   *
   * @param {string} roomID 房间号
   * @returns {Promise}
   */
  async enterRoom(roomID: string): Promise<TUIRoomResponse<any>> {
    this.checkLogin();
    const tuiResponse = await this.roomLifecycle.enterRoom({
      SDKAppID: this.SDKAppID,
      userID: this.state.currentUser.ID,
      userSig: this.userSig,
      roomID,
    });

    // 初始化 Room Coordinator
    this.roomCoordinator.init({
      roomID,
      tim: this.tim,
    });

    const {
      room,
      user,
    } = tuiResponse.data;
    this.emitter.emit(TUIRoomEvents.onUserEnterRoom, user);
    return TUIRoomResponse.success(room);
  }

  /**
   * 离开房间
   *
   * 先退出 TRTC 房间，再退出 TIM 群
   * @returns {Promise}
   */
  async exitRoom(): Promise<TUIRoomResponse<any>> {
    this.checkLogin();
    const tuiResponse = await this.roomLifecycle.exitRoom();
    const {
      user,
    } = tuiResponse.data;
    return TUIRoomResponse.success();
  }

  /**
   * 获取房间信息
   *
   * @returns {TTUIRoomInfo}
   */
  getRoomInfo(): TUIRoomInfo {
    // 克隆一份数据
    return simpleClone(this.state.roomInfo);
  }

  /**
   * 获取当前用户信息
   * @returns {TUIRoomUser}
   */
  getCurrentUser(): TUIRoomUser {
    return simpleClone(this.state.currentUser);
  }

  /**
   * 获取所有成员信息
   *
   * @returns {Record<TUIRoomUser>}
   */
  getRoomUsers(): Record<string, TUIRoomUser> {
    const usersMap: Record<string, TUIRoomUser> = {};
    this.state.userMap.forEach((value) => {
      usersMap[(value as TUIRoomUser).ID] = simpleClone(value);
    });
    return usersMap;
  }

  /**
   * 获取指定用户信息
   *
   * @param {string} userID 成员ID
   * @returns {TUIRoomUser | null}
   */
  getUserInfo(userID: string): TUIRoomUser | null {
    if (this.state.userMap.has(userID)) {
      const user = this.state.userMap.get(userID) as TUIRoomUser;
      return simpleClone(user);
    }
    return null;
  }

  /**
   * 设置用户名和头像
   *
   * @param {string} name 用户名
   * @param {string} avatarURL 头像地址
   */
  setSelfProfile(name: string, avatarURL: string) {
    this.state.currentUser.name = name;
    this.state.currentUser.avatar = avatarURL;
  }

  /**
   * 将房间转交给其他成员
   *
   * @param {string} userID 主持人将房间控制权转交给其他成员
   * @returns {Promise}
   */
  async transferRoomMaster(userID: string): Promise<TUIRoomResponse<any>> {
    return TUIRoomResponse.success();
  }

  /**
   * 临时退出TRTC房间（多窗口需要的特殊接口）
   *
   * @returns {Promise}
   * @deprecated
   */
  async leaveTRTCRoom(): Promise<TUIRoomResponse<any>> {
    const tuiResponse = await this.trtcService.exitRoom();
    return tuiResponse;
  }

  /**
   * 进入TRTC房间
   *
   * @returns {any}
   * @deprecated
   */
  enterTRTCRoom(
    roomID: string,
    rtcConfig = {},
    ctx: object,
  ): any {
    const tuiResponse = this.trtcService.enterRoom({
      SDKAppID: this.SDKAppID,
      userID: this.state.currentUser.ID,
      userSig: this.userSig,
      roomID: parseInt(roomID, 10),
      rtcConfig,
    }, ctx);
    return tuiResponse;
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   TRTC 相关接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */


  initTRTCService(ctx) {
    this.trtcService = new TRTCService(ctx);
    this.roomAuth.setTRTCService(this.trtcService);
    this.roomLifecycle.setTRTCService(this.trtcService);
    this.bindTRTCEvent();
  }

  /**
   * 创建推流实例
   * @param {Record<string, any>} rtcConfig
   * @returns {any}
   */
  createPusher(rtcConfig: Record<string, any>) {
    return this.trtcService.createPusher(rtcConfig);
  }

  getPlayerList() {
    return this.trtcService.getPlayerList();
  }

  setPusherAttributes(options: Record<string, any>): Array<Record<string, any>> {
    return this.trtcService.setPusherAttributes(options);
  }

  setPlayerAttributes(id: string, options: Record<string, any>): Array<Record<string, any>> {
    return this.trtcService.setPlayerAttributes(id, options);
  }

  // live-pusher EventHandler
  pusherEventHandler(event) {
    this.trtcService.pusherEventHandler(event);
  }

  pusherNetStatusHandler(event) {
    this.trtcService.pusherNetStatusHandler(event);
  }

  pusherErrorHandler(event) {
    this.trtcService.pusherErrorHandler(event);
  }

  pusherBGMStartHandler(event) {
    this.trtcService.pusherBGMStartHandler(event);
  }

  pusherBGMProgressHandler(event) {
    this.trtcService.pusherBGMProgressHandler(event);
  }

  pusherBGMCompleteHandler(event) {
    this.trtcService.pusherBGMCompleteHandler(event);
  }

  pusherAudioVolumeNotify(event) {
    this.trtcService.pusherAudioVolumeNotify(event);
  }

  // live-pusher EventHandler
  playerEventHandler(event) {
    this.trtcService.playerEventHandler(event);
  }

  playerFullscreenChange(event) {
    this.trtcService.playerFullscreenChange(event);
  }

  playerNetStatus(event) {
    this.trtcService.playerNetStatus(event);
  }

  playerAudioVolumeNotify(event) {
    this.trtcService.playerAudioVolumeNotify(event);
  }

  /**
   * 切换摄像头（前后置）
   */
  switchCamera(options ?: any) {
    this.trtcService.switchCamera(options);
  }


  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    TRTC 事件处理
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  private handleTRTCEvents(type: ('on' | 'off'), ctx ?: any) {
    this.trtcService[type](TRTCEvents.LOCAL_JOIN, this.LOCAL_JOIN, ctx);
    this.trtcService[type](TRTCEvents.LOCAL_LEAVE, this.LOCAL_LEAVE, ctx);
    this.trtcService[type](TRTCEvents.KICKED_OUT, this.KICKED_OUT, ctx);
    this.trtcService[type](TRTCEvents.REMOTE_USER_JOIN, this.REMOTE_USER_JOIN, ctx);
    this.trtcService[type](TRTCEvents.REMOTE_USER_LEAVE, this.REMOTE_USER_LEAVE, ctx);
    this.trtcService[type](TRTCEvents.REMOTE_VIDEO_ADD, this.REMOTE_VIDEO_ADD, ctx);
    this.trtcService[type](TRTCEvents.REMOTE_VIDEO_REMOVE, this.REMOTE_VIDEO_REMOVE, ctx);
    this.trtcService[type](TRTCEvents.REMOTE_AUDIO_ADD, this.REMOTE_AUDIO_ADD, ctx);
    this.trtcService[type](TRTCEvents.REMOTE_AUDIO_REMOVE, this.REMOTE_AUDIO_REMOVE, ctx);
    this.trtcService[type](TRTCEvents.REMOTE_STATE_UPDATE, this.REMOTE_STATE_UPDATE, ctx);
    this.trtcService[type](TRTCEvents.LOCAL_NET_STATE_UPDATE, this.LOCAL_NET_STATE_UPDATE, ctx);
    this.trtcService[type](TRTCEvents.REMOTE_NET_STATE_UPDATE, this.REMOTE_NET_STATE_UPDATE, ctx);
    this.trtcService[type](TRTCEvents.REMOTE_AUDIO_VOLUME_UPDATE, this.REMOTE_AUDIO_VOLUME_UPDATE, ctx);
    this.trtcService[type](TRTCEvents.LOCAL_AUDIO_VOLUME_UPDATE, this.LOCAL_AUDIO_VOLUME_UPDATE, ctx);
    this.trtcService[type](TRTCEvents.VIDEO_FULLSCREEN_UPDATE, this.VIDEO_FULLSCREEN_UPDATE, ctx);
    this.trtcService[type](TRTCEvents.BGM_PLAY_PROGRESS, this.BGM_PLAY_PROGRESS, ctx);
    this.trtcService[type](TRTCEvents.BGM_PLAY_COMPLETE, this.BGM_PLAY_COMPLETE, ctx);
    this.trtcService[type](TRTCEvents.ERROR, this.ERROR, ctx);
  }

  private bindTRTCEvent() {
    this.handleTRTCEvents('on', this);
  }

  private unbindTRTCEvent() {
    this.handleTRTCEvents('off');
  }

  private async LOCAL_JOIN(event: Record<string, any>) {
    await this.addUser(this.state.currentUser.ID);
    this.emitter.emit(TRTCEvents.LOCAL_JOIN, event.data);
  }

  private LOCAL_LEAVE(event: Record<string, any>) {
    this.deleteUser(this.state.currentUser.ID);
    this.emitter.emit(TRTCEvents.LOCAL_LEAVE, event.data);
  }

  private KICKED_OUT(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.KICKED_OUT, event.data);
  }

  private async REMOTE_USER_JOIN(event: Record<string, any>) {
    const {
      userID,
    } = event.data;
    await this.addUser(userID);
    this.emitter.emit(TRTCEvents.REMOTE_USER_JOIN, event.data);
  }

  private REMOTE_USER_LEAVE(event: Record<string, any>) {
    const {
      userID,
    } = event.data;
    this.deleteUser(userID);
    this.emitter.emit(TRTCEvents.REMOTE_USER_LEAVE, event.data);
  }

  private REMOTE_VIDEO_ADD(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.REMOTE_VIDEO_ADD, event.data);
  }

  private REMOTE_VIDEO_REMOVE(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.REMOTE_VIDEO_REMOVE, event.data);
  }

  private REMOTE_STATE_UPDATE(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.REMOTE_STATE_UPDATE, event.data);
  }

  private REMOTE_AUDIO_ADD(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.REMOTE_AUDIO_ADD, event.data);
  }

  private REMOTE_AUDIO_REMOVE(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.REMOTE_AUDIO_REMOVE, event.data);
  }

  private LOCAL_NET_STATE_UPDATE(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.LOCAL_NET_STATE_UPDATE, event.data);
  }

  private REMOTE_NET_STATE_UPDATE(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.REMOTE_NET_STATE_UPDATE, event.data);
  }

  private REMOTE_AUDIO_VOLUME_UPDATE(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.REMOTE_AUDIO_VOLUME_UPDATE, event.data);
  }

  private LOCAL_AUDIO_VOLUME_UPDATE(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.LOCAL_AUDIO_VOLUME_UPDATE, event.data);
  }

  private VIDEO_FULLSCREEN_UPDATE(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.VIDEO_FULLSCREEN_UPDATE, event.data);
  }

  private BGM_PLAY_PROGRESS(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.BGM_PLAY_PROGRESS, event.data);
  }

  private BGM_PLAY_COMPLETE(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.BGM_PLAY_COMPLETE, event.data);
  }

  private ERROR(event: Record<string, any>) {
    this.emitter.emit(TRTCEvents.ERROR, event.data);
  }

  private async addUser(userID: string) {
    const newUser = new TUIRoomUser();
    const userInfo = await (await this.timService.getUserProfile([userID])).data[0];
    newUser.init(userInfo);
    this.state.userMap.set(userID, newUser);
  }

  private deleteUser(userID: string) {
    if (this.state.userMap.has(userID)) {
      this.state.userMap.delete(userID);
    }
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    IM 消息发送相关接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 发送文本消息
   *
   * @param {string} text 消息文本内容
   * @returns {Promise}
   */
  sendChatMessage(text: string): Promise<TUIRoomResponse<any>> {
    return this.timService.sendChatMessage(text);
  }

  /**
   * 发送自定义消息
   *
   * @param {string} type - 自定义消息类型
   * @param {string} data - JSON string
   * @returns {Promise}
   */
  sendCustomMessage(type: string, data: string): Promise<TUIRoomResponse<any>> {
    return this.timService.sendCustomMessage(type, data);
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    IM 事件处理
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  private bindIMEvent() {
    this.timService.onRoomEvent(TUIRoomEvents.onReceiveChatMessage, this.onReceiveChatMessage); // eslint-disable-line
    this.timService.onRoomEvent(TUIRoomEvents.onReceiveCustomMessage, this.onReceiveCustomMessage); // eslint-disable-line
    this.timService.onRoomEvent(TUIRoomEvents.onRoomDestroyed, this.onRoomDestroyed); // eslint-disable-line
  }

  private unbindIMEvent() {
    this.timService.offRoomEvent(TUIRoomEvents.onReceiveChatMessage, this.onReceiveChatMessage); // eslint-disable-line
    this.timService.offRoomEvent(TUIRoomEvents.onReceiveCustomMessage, this.onReceiveCustomMessage); // eslint-disable-line
    this.timService.offRoomEvent(TUIRoomEvents.onRoomDestroyed, this.onRoomDestroyed); // eslint-disable-line
  }

  // 处理聊天消息接收事件
  private onReceiveChatMessage(event: Record<string, any>) {
    const {
      data: message,
    } = event;
    this.emitter.emit(TUIRoomEvents.onReceiveChatMessage, message);
  }

  // 处理自定义消息接收事件
  private onReceiveCustomMessage(event: Record<string, any>) {
    const {
      data: message,
    } = event;
    this.emitter.emit(TUIRoomEvents.onReceiveCustomMessage, message);
  }

  // 处理房间销毁（群解散）事件
  private onRoomDestroyed() {
    this.emitter.emit(TUIRoomEvents.onRoomDestroyed, null);
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    room接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */


  async muteUserMicrophone(
    userID: string,
    mute: boolean,
  ): Promise<TUIRoomResponse<any>> {
    return this.roomCoordinator.muteUserMicrophone(userID, mute);
  }

  async muteAllUsersMicrophone(mute: boolean): Promise<TUIRoomResponse<any>> {
    return this.roomCoordinator.muteAllUsersMicrophone(mute);
  }

  async muteUserCamera(
    userID: string,
    mute: boolean,
  ): Promise<TUIRoomResponse<any>> {
    return this.roomCoordinator.muteUserCamera(userID, mute);
  }

  async muteAllUsersCamera(mute: boolean): Promise<TUIRoomResponse<any>> {
    return this.roomCoordinator.muteAllUsersCamera(mute);
  }

  async kickOffUser(userID: string): Promise<TUIRoomResponse<any>> {
    return this.roomCoordinator.kickOffUser(userID);
  }


  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    room事件监听处理
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  private bindCoordinatorEvent() {
    this.roomCoordinator.on(
      TUIRoomEvents.onMicrophoneMuted,
      this.onMicrophoneMuted,
      this,
    );
    this.roomCoordinator.on(
      TUIRoomEvents.onCameraMuted,
      this.onCameraMuted,
      this,
    );
    this.roomCoordinator.on(
      TUIRoomEvents.onKickOff,
      this.onKickOff,
      this,
    );
  }

  private unbindCoordinatorEvent() {
    this.roomCoordinator.off(
      TUIRoomEvents.onMicrophoneMuted,
      this.onMicrophoneMuted,
    );
    this.roomCoordinator.off(
      TUIRoomEvents.onCameraMuted,
      this.onCameraMuted,
    );
    this.roomCoordinator.off(
      TUIRoomEvents.onKickOff,
      this.onKickOff,
    );
  }

  // 开启/关闭麦克风
  private onMicrophoneMuted(event: Record<string, any>) {
    this.state.currentUser.isMicrophoneMuted = event.data;
    this.emitter.emit(
      TUIRoomEvents.onMicrophoneMuted,
      simpleClone(event.data),
    );
  }

  // 开启/关闭摄像头
  private onCameraMuted(event: Record<string, any>) {
    this.state.currentUser.isCameraMuted = event.data;
    this.emitter.emit(
      TUIRoomEvents.onCameraMuted,
      simpleClone(event.data),
    );
  }

  private onKickOff(event: Record<string, any>) {
    this.emitter.emit(
      TUIRoomEvents.onKickOff,
      simpleClone(event.data),
    );
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    事件监听注册接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */

  /**
   * 注册事件监听
   */
  on(
    eventName: string,
    handler: (...args: any) => void,
    ctx ?: Record<string, any>,
  ) {
    this.emitter.on(eventName, handler, ctx);
  }

  /**
   * 取消事件监听
   */
  off(eventName: string, handler: (...args: any) => void) {
    this.emitter.off(eventName as string, handler);
  }

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    其他接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */


  /**
   * 销毁当前 TUIRoomCore 实例对象
   *
   * 如果没有退出登录，先退出登录
   */
  async destroy() {
    try {
      if (this.isLogin) {
        await this.logout();
      }
      this.state.reset();

      this.unbindCoordinatorEvent();
      this.unbindIMEvent();
      await this.timService.destroy();
    } catch (error: any) {
      throw error as TUIRoomError;
    }
  }
}

export default TUIRoomCore;
