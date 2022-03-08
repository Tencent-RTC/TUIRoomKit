/**
 * Room统一接口
 *
 * 接口设计原则：
 *  （1）主动调用且需要处理异步响应的，定义为异步的 Promise 接口，
 * 如：进房接口（这一点与 TRTC 接口不同，TRTC 主动调用需要等待异步响应的接口，
 * 都是通过事件处理的异步响应）
 *  （2）需要被动触发的接口，通过事件接口实现，如：远端用户进房事件接口
 */
import {
  TUISpeechMode,
} from '../types';
import TUIRoomInfo from '../base/TUIRoomInfo';
import TUIRoomUser from '../base/TUIRoomUser';
import TUIRoomResponse from '../base/TUIRoomResponse';

export default interface ITUIRoomCore {
  /**
   * 以下 创建 和 销毁 单例的方法声明注释掉，因为 eslint 的 TS 的
   * 接口继承会提示错误，对 static 方法支持不是很好。
   */
  /**
   * 获取单例实例
   */
  // getInstance: () => ITUIRoomCore;

  // /**
  //  * 销毁单例实例
  //  */
  // destroyInstance: () => void;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   基础接口
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
  login: (
    SDKAppID: number,
    userID: string,
    userSig: string
  ) => Promise < TUIRoomResponse < any >> ;

  /**
   * 登出
   *
   * @returns {Promise}
   */
  logout: () => Promise < TUIRoomResponse < any >> ;

  /**
   * 创建房间
   *
   * 主持人创建房间，内部需要同时实现 TIM 建群和 TRTC 进房。
   * 如果 TIM 群已存在，切当前用户是群主，则加入群组；
   * 如果群租已存在，当前用户不是群主，提示房间号已被占用。
   * @param {string} roomID 房间号
   * @param {object} rtcConfig 进房参数
   * @param {TUISpeechMode} mode 发言模式，默认为“申请发言”模式
   * @returns {Promise}
   */
  createRoom: (
    roomID: string,
    rtcConfig?: object,
    mode?: TUISpeechMode
  ) => Promise < TUIRoomResponse < any >> ;

  /**
   * 销毁房间
   *
   * 主持人销毁房间，内部需要同时实现 TIM 解散群和 TRTC 退房。观众端会收到房间销毁事件通知 onRoomDestroyed.
   * 需要先退出 TRTC 房间，再解散 TIM 群组。
   * @returns {Promise}
   */
  destroyRoom: () => Promise < TUIRoomResponse < any >> ; //

  /**
   * 进入房间
   *
   * @param {string} roomID 房间号
   * @returns {Promise}
   */
  enterRoom: (roomID: string) => Promise < TUIRoomResponse < any >> ;

  /**
   * 离开房间
   *
   * 内部需要同时实现 TIM 退群和 TRTC 退房
   * @returns {Promise}
   */
  exitRoom: () => Promise < TUIRoomResponse < any >> ;

  /**
   * 获取房间信息
   *
   * @returns {TUIRoomInfo}
   */
  getRoomInfo: () => TUIRoomInfo; // 房间ID、名称、公告等，公告信息在UI层如何使用各端不一致，暴露出来可以兼容各端

  /**
   * 获取当前用户信息
   *
   * @returns {TUIRoomUser}
   */
  getCurrentUser: () => TUIRoomUser;
  
  /**
   * 获取所有成员信息
   *
   * @returns {Array<TUIRoomUser>}
   */
  getRoomUsers: () => Record <string, TUIRoomUser> ;

  /**
   * 获取指定用户信息
   *
   * @param {string} userID 成员ID
   * @returns {TUIRoomUser | null}
   */
  getUserInfo: (userID: string) => TUIRoomUser | null;

  /**
   * 设置用户名和头像
   *
   * @param {string} name 用户名
   * @param {string} avatarURL 头像地址
   */
  setSelfProfile: (name: string, avatarURL: string) => void;

  /**
   * 将房间转交给其他成员
   *
   * @param {string} userID 主持人将房间控制权转交给其他成员
   * @returns {Promise}
   */
  transferRoomMaster: (userID: string) => Promise < TUIRoomResponse < any >> ;

  /**
   * 退出TRTC房间（多窗口需要的特殊接口）
   *
   * @returns {Promise}
   */
  leaveTRTCRoom: () => Promise < TUIRoomResponse < any >> ;

  /**
   * 进入TRTC房间（多窗口需要的特殊接口）
   *
   * @returns {any}
   */
  enterTRTCRoom: (roomID: string,rtcConfig:Record<string, any>, ctx: object) => any;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   TRTC 相关接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */

  /**
   * 创建推流实例
   * @param {Record<string, any>} rtcConfig
   * @returns {any}
   */
  createPusher: (rtcConfig: Record<string, any>) => any

  // live-pusher EventHandler
  pusherEventHandler:(event:any) => void
  pusherNetStatusHandler:(event:any) => void
  pusherErrorHandler:(event:any) => void
  pusherBGMStartHandler:(event:any) => void
  pusherBGMProgressHandler:(event:any) => void
  pusherBGMCompleteHandler:(event:any) => void
  pusherAudioVolumeNotify:(event:any) => void

  setPusherAttributes:(options:Record<string,any>) => Array<Record<string, any>>


  // live-player EventHandler
  playerEventHandler:(event:any) => void
  playerFullscreenChange:(event:any) => void
  playerNetStatus:(event:any) => void
  playerAudioVolumeNotify:(event:any) => void

  setPlayerAttributes:(id:string, options:Record<string,any>) => Array<Record<string, any>>

  getPlayerList:() => Array<any>


  /**
   * 切换摄像头（前后置）
   */
  switchCamera: (options?:any ) => void


  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    IM 相关接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 发送文本消息
   *
   * @param {string} text 消息文本内容
   * @returns {Promise}
   */
  sendChatMessage: (text: string) => Promise < TUIRoomResponse < any >> ;

  /**
   * 发送自定义消息
   *
   * @param {string} type - 自定义消息类型
   * @param {string} data - JSON string
   * @returns {Promise}
   */
  sendCustomMessage: (
    type: string,
    data: string
  ) => Promise < TUIRoomResponse < any >> ;

    /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    room接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  muteUserMicrophone: (
    userID: string,
    mute: boolean
  ) => Promise < TUIRoomResponse < any >> ;


  muteAllUsersMicrophone:(mute: boolean) => Promise < TUIRoomResponse < any >>;

  muteUserCamera: (
    userID: string,
    mute: boolean
  ) => Promise < TUIRoomResponse < any >> ;

  muteAllUsersCamera:(mute: boolean) => Promise < TUIRoomResponse < any >>;

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
  on: (
    eventName: string,
    handler: (...args: any) => void,
    ctx: Record < string, any >
  ) => void;

  /**
   * 取消事件监听
   */
  off: (eventName: string, handler: (...args: any) => void) => void;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    其他接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 销毁
   */
  destroy: () => void;
}