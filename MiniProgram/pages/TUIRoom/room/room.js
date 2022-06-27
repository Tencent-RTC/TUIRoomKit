import { TRTCEvents, TUIRoomRole, TUIRoomEvents } from '../../../lib/TUIRoom/lib/index';
Page({
  data: {
    roomInfo: {},
    currentUser: {},
    userListShow: false,
    beautyPanel: false,
    beautyLevel: 5,
    whitenessLevel: 5,
    beautyStyle: 'smooth',
    filter: '',
    filterList: [
      { imageUrl: '../../../assets/images/beauty_ic_common_none.png', des: '清除', value: '' },
      { imageUrl: '../../../assets/images/beauty_biaozhun.png', des: '标准', value: 'standard' },
      { imageUrl: '../../../assets/images/beauty_fennen.png', des: '粉嫩', value: 'pink' },
      { imageUrl: '../../../assets/images/beauty_huaijiu.png', des: '怀旧', value: 'nostalgia' },
      { imageUrl: '../../../assets/images/beauty_landiao.png', des: '蓝调', value: 'blues' },
      { imageUrl: '../../../assets/images/beauty_langman.png', des: '浪漫', value: 'romantic' },
      { imageUrl: '../../../assets/images/beauty_qingliang.png', des: '清凉', value: 'cool' },
      { imageUrl: '../../../assets/images/beauty_qingxin.png', des: '清新', value: 'fresher' },
      { imageUrl: '../../../assets/images/beauty_rixi.png', des: '日系', value: 'solor' },
      { imageUrl: '../../../assets/images/beauty_weimei.png', des: '唯美', value: 'aestheticism' },
      { imageUrl: '../../../assets/images/beauty_fwhite.png', des: '美白', value: 'whitening' },
      { imageUrl: '../../../assets/images/beauty_yinghong.png', des: '樱红', value: 'cerisered' },
    ],
    indicatorDots: true,
    list: [],
    listMap: {},
    userList: {},
    roomDestroy: false,
    kickOff: false,
    isFullScreen: {},
  },
  onLoad(options) {
    const { roomId, enableMic, enableCamera } = options;
    this.data.roomInfo = wx.$TUIRoomCore.getRoomInfo();
    wx.$TUIRoomCore.initTRTCService(this);
    this.bindTRTCEvent();
    this.bindCoordinaEvent();
    const pusher = wx.$TUIRoomCore.enterTRTCRoom(
        roomId,
        {
          enableMic: enableMic === 'true' && !this.data.roomInfo.roomConfig.isAllMicMuted,
          enableCamera: enableCamera === 'true' && !this.data.roomInfo.roomConfig.isAllCameraMuted,
        },
        this,
    );
    this.data.listMap[pusher.userID] = pusher;
    this.setData({
      roomInfo: wx.$TUIRoomCore.getRoomInfo(),
      currentUser: wx.$TUIRoomCore.getCurrentUser(),
      list: [pusher],
      listMap: this.data.listMap,
    });
  },
  onUnload() {
    if (this.data.currentUser.role === TUIRoomRole.MASTER) {
      wx.$TUIRoomCore.destroyRoom();
      wx.showToast({ title: '房间已销毁', icon: 'none' });
    } else {
      wx.$TUIRoomCore.exitRoom();
      if (this.data.roomDestroy) {
        wx.showToast({ title: `房间被销毁`, icon: 'none' });
        return;
      }
      if (this.data.kickOff) {
        wx.showToast({ title: `您被踢出房间`, icon: 'none' });
        return;
      }
      wx.showToast({ title: `已退出房间`, icon: 'none' });
    }
  },
  onHide() {},
  back() {
    wx.navigateBack();
  },
  copyRoomId() {
    wx.setClipboardData({
      data: String(this.data.roomInfo.roomID),
    });
  },
  switchCamera() {
    wx.$TUIRoomCore.switchCamera();
  },
  // 主持人禁用观众麦克风，不可拒绝，只能接受
  async muteUserMicrophone(event) {
    if (this.data.roomInfo.roomConfig.isAllMicMuted) return;
    if (this.data.currentUser.role !== TUIRoomRole.MASTER) return;
    const { userid: userID, mute } = event.currentTarget.dataset;
    if (this.data.currentUser.ID === userID) return;
    const res = await wx.$TUIRoomCore.muteUserMicrophone(userID, mute);
    this.setData({ userList: wx.$TUIRoomCore.getRoomUsers() });
    const message = mute ? '已禁言' : '解除禁言';
    wx.showToast({
      title: `${res.code === 0 ? message : res.message || '操作失败'}`,
      icon: 'none',
    });
  },
  async muteAllUsersMicrophone(event) {
    const { mute } = event.currentTarget.dataset;
    const res = await wx.$TUIRoomCore.muteAllUsersMicrophone(mute);
    wx.showToast({
      title: `${res.code === 0 ? '操作成功' : res.message || '操作失败'}`,
      icon: 'none',
    });
    this.setData({
      roomInfo: wx.$TUIRoomCore.getRoomInfo(),
      currentUser: wx.$TUIRoomCore.getCurrentUser(),
      userList: wx.$TUIRoomCore.getRoomUsers(),
    });
  },
  async muteUserCamera(event) {
    if (this.data.roomInfo.roomConfig.isAllCameraMuted) return;
    if (this.data.currentUser.role !== TUIRoomRole.MASTER) return;
    const { userid: userID, mute } = event.currentTarget.dataset;
    if (this.data.currentUser.ID === userID) return;
    const res = await wx.$TUIRoomCore.muteUserCamera(userID, mute);
    this.setData({ userList: wx.$TUIRoomCore.getRoomUsers() });
    const message = mute ? '已禁画' : '解除禁画';
    wx.showToast({
      title: `${res.code === 0 ? message : res.message || '操作失败'}`,
      icon: 'none',
    });
  },
  async muteAllUsersCamera(event) {
    const { mute } = event.currentTarget.dataset;
    const res = await wx.$TUIRoomCore.muteAllUsersCamera(mute);
    wx.showToast({
      title: `${res.code === 0 ? '操作成功' : res.message || '操作失败'}`,
      icon: 'none',
    });
    this.setData({
      roomInfo: wx.$TUIRoomCore.getRoomInfo(),
      currentUser: wx.$TUIRoomCore.getCurrentUser(),
      userList: wx.$TUIRoomCore.getRoomUsers(),
    });
    console.log(this.data.roomInfo.roomConfig, this.data.currentUser);
  },
  async kickOffUser(event) {
    const { userid: userID } = event.currentTarget.dataset;
    const res = await wx.$TUIRoomCore.kickOffUser(userID);
    wx.showToast({
      title: `${res.code === 0 ? '操作成功' : res.message || '操作失败'}`,
      icon: 'none',
    });
  },
  bindTRTCEvent() {
    wx.$TUIRoomCore.on(TRTCEvents.LOCAL_JOIN, (event) => {
      this.setData({ userList: wx.$TUIRoomCore.getRoomUsers() });
    });
    wx.$TUIRoomCore.on(TRTCEvents.REMOTE_USER_JOIN, (event) => {
      const { userID } = event.data;

      this.setData({ userList: wx.$TUIRoomCore.getRoomUsers() }, () => {
        const { nick } = this.data.userList[userID];
        wx.showToast({
          title: `${nick || userID} 进入了房间`,
          icon: 'none',
        });
      });
    });
    wx.$TUIRoomCore.on(TRTCEvents.REMOTE_USER_LEAVE, (event) => {
      console.log(event, 'REMOTE_USER_LEAVE');
      const { userID } = event.data;
      const { nick } = this.data.userList[userID];
      wx.showToast({
        title: `${nick || userID} 退出了房间`,
        icon: 'none',
      });
      this.setData({ userList: wx.$TUIRoomCore.getRoomUsers() });
    });
    // 远端用户推送视频
    wx.$TUIRoomCore.on(TRTCEvents.REMOTE_VIDEO_ADD, (event) => {
      console.log('* room REMOTE_VIDEO_ADD', event);
      const { player } = event.data;
      // 开始播放远端的视频流，默认是不播放的
      this.setPlayerAttributesHandler(player, {
        muteVideo: false,
      });
    });
    // 远端用户取消推送视频
    wx.$TUIRoomCore.on(TRTCEvents.REMOTE_VIDEO_REMOVE, (event) => {
      console.log('* room REMOTE_VIDEO_REMOVE', event);
      const { player } = event.data;
      this.setPlayerAttributesHandler(player, {
        muteVideo: true,
      });
    });
    // 远端用户推送音频
    wx.$TUIRoomCore.on(TRTCEvents.REMOTE_AUDIO_ADD, (event) => {
      console.log('* room REMOTE_AUDIO_ADD', event);
      const { player } = event.data;
      this.setPlayerAttributesHandler(player, {
        muteAudio: false,
      });
    });
    // 远端用户取消推送音频
    wx.$TUIRoomCore.on(TRTCEvents.REMOTE_AUDIO_REMOVE, (event) => {
      console.log('* room REMOTE_AUDIO_REMOVE', event);
      const { player } = event.data;
      this.setPlayerAttributesHandler(player, {
        muteAudio: true,
      });
    });

    // 远端音量变化
    wx.$TUIRoomCore.on(TRTCEvents.REMOTE_AUDIO_VOLUME_UPDATE, (event) => {
      const { playerList } = event.data;
      this.setData({
        list: [this.data.list[0], ...playerList],
      });
    });

    // 本地音量变化
    wx.$TUIRoomCore.on(TRTCEvents.LOCAL_AUDIO_VOLUME_UPDATE, (event) => {
      const { pusher } = event.data;
      this.data.list[0] = pusher;
      this.setData({
        list: this.data.list,
      });
    });
  },
  getInfo() {
    this.setData({
      roomInfo: wx.$TUIRoomCore.getRoomInfo(),
      currentUser: wx.$TUIRoomCore.getCurrentUser(),
    });
  },
  requestFullScreen(e) {
    const { id, streamid: streamID, mutevideo: muteVideo } = e.currentTarget.dataset;
    if (this.data.isFullScreen[id]) return;
    if (muteVideo) return;
    wx.createLivePlayerContext(id, this).requestFullScreen({
      success: () => {
        this.data.isFullScreen[id] = true;
        this.setData({ isFullScreen: this.data.isFullScreen });
        this.setPlayerAttributesHandler({ streamID }, { objectFit: 'contain', orientation: 'horizontal' });
      },
    });
  },
  exitFullScreen(e) {
    const { id, streamid: streamID } = e.currentTarget.dataset;
    wx.createLivePlayerContext(id, this).exitFullScreen({
      success: () => {
        this.setData({ isFullScreen: {} });
        this.setPlayerAttributesHandler({ streamID }, { objectFit: 'fillCrop', orientation: 'vertical' });
      },
    });
  },
  // 房间内事件绑定
  bindCoordinaEvent() {
    wx.$TUIRoomCore.on(TUIRoomEvents.onRoomDestroyed, () => {
      if (this.data.currentUser.role !== TUIRoomRole.MASTER) {
        this.data.roomDestroy = true;
        wx.navigateBack();
      }
    });
    wx.$TUIRoomCore.on(TUIRoomEvents.onMicrophoneMuted, (event) => {
      this.setPusherAttributesHandler({ enableMic: false });
      wx.showToast({
        title: `您被${event.data ? '禁言' : '解除禁言'}`,
        icon: 'none',
      });
      this.setData({
        roomInfo: wx.$TUIRoomCore.getRoomInfo(),
        currentUser: wx.$TUIRoomCore.getCurrentUser(),
        userList: wx.$TUIRoomCore.getRoomUsers(),
      });
    });
    wx.$TUIRoomCore.on(TUIRoomEvents.onCameraMuted, (event) => {
      this.setPusherAttributesHandler({ enableCamera: false });
      wx.showToast({
        title: `您被${event.data ? '禁画' : '解除禁画'}`,
        icon: 'none',
      });
      this.setData({
        roomInfo: wx.$TUIRoomCore.getRoomInfo(),
        currentUser: wx.$TUIRoomCore.getCurrentUser(),
        userList: wx.$TUIRoomCore.getRoomUsers(),
      });
    });
    wx.$TUIRoomCore.on(TUIRoomEvents.onKickOff, (event) => {
      this.data.kickOff = true;
      wx.navigateBack();
    });
  },
  enableMicChange() {
    if (this.data.currentUser.isMicrophoneMuted) {
      wx.showToast({
        title: `您被禁言`,
        icon: 'none',
      });
      return;
    }
    this.setPusherAttributesHandler({ enableMic: !this.data.listMap[this.data.currentUser.ID].enableMic });
  },

  enableCameraChange() {
    if (this.data.currentUser.isCameraMuted) {
      wx.showToast({
        title: `您被禁画`,
        icon: 'none',
      });
      return;
    }
    this.setPusherAttributesHandler({ enableCamera: !this.data.listMap[this.data.currentUser.ID].enableCamera });
  },
  userListPanelShow() {
    this.setData({ userListShow: true });
  },
  userListPanelClose() {
    this.setData({ userListShow: false });
  },
  beautyPanelShow() {
    this.setData({ beautyPanel: true });
  },
  beautyPanelClose() {
    this.setData({ beautyPanel: false });
  },
  // 美颜强度
  onBeautyLevelDrag(event) {
    this.setData({
      beautyLevel: event.detail.value,
    });
    this.setPusherAttributesHandler({ beautyLevel: this.data.beautyLevel });
  },
  // 美白强度
  onWhitenessLevelDrag(event) {
    this.setData({
      whitenessLevel: event.detail.value,
    });
    this.setPusherAttributesHandler({ whitenessLevel: this.data.whitenessLevel });
  },
  // 美颜类型选择
  beautyTypeChange(event) {
    this.setData({ beautyStyle: event.detail.value });
    this.setPusherAttributesHandler({ beautyStyle: this.data.beautyStyle });
  },
  // 滤镜选择
  filterSelect(event) {
    const { value, index } = event.currentTarget.dataset;
    if (this.filterSelect.historyIndex !== undefined) {
      this.data.filterList[this.filterSelect.historyIndex].selected = false;
    }
    this.filterSelect.historyIndex = index;
    this.data.filterList[index].selected = true;
    this.setData({
      filter: value,
      filterList: this.data.filterList,
    });
    this.setPusherAttributesHandler({ filter: this.data.filter });
  },
  arrayTransformToMap(array, key) {
    const map = {};
    array.forEach((item) => {
      map[item[key]] = item;
    });
    return map;
  },
  // 设置 pusher 属性
  setPusherAttributesHandler(options) {
    this.data.list[0] = wx.$TUIRoomCore.setPusherAttributes(options);
    this.setData({
      listMap: this.arrayTransformToMap(this.data.list, 'userID'),
      list: this.data.list,
    });
  },
  setPlayerAttributesHandler(player, options) {
    this.data.list = [this.data.list[0], ...wx.$TUIRoomCore.setPlayerAttributes(player.streamID, options)];
    this.setData({
      list: this.data.list,
      listMap: this.arrayTransformToMap(this.data.list, 'userID'),
    });
  },
  _pusherStateChangeHandler(event) {
    wx.$TUIRoomCore.pusherEventHandler(event);
  },
  _pusherNetStatusHandler(event) {
    wx.$TUIRoomCore.pusherNetStatusHandler(event);
  },
  _pusherErrorHandler(event) {
    wx.$TUIRoomCore.pusherErrorHandler(event);
  },
  _pusherBGMStartHandler(event) {
    wx.$TUIRoomCore.pusherBGMStartHandler(event);
  },
  _pusherBGMProgressHandler(event) {
    wx.$TUIRoomCore.pusherBGMProgressHandler(event);
  },
  _pusherBGMCompleteHandler(event) {
    wx.$TUIRoomCore.pusherBGMCompleteHandler(event);
  },
  _pusherAudioVolumeNotify(event) {
    wx.$TUIRoomCore.pusherAudioVolumeNotify(event);
  },
  _playerStateChange(event) {
    wx.$TUIRoomCore.playerEventHandler(event);
  },
  _playerFullscreenChange(event) {
    const { detail, target } = event;
    this.data.isFullScreen[target.id] = detail.fullScreen;
    this.setData({ isFullScreen: this.data.isFullScreen }); // 防止通过系统返回退出全屏导致按钮状态未变更
    wx.$TUIRoomCore.playerFullscreenChange(event);
  },
  _playerNetStatus(event) {
    wx.$TUIRoomCore.playerNetStatus(event);
  },
  _playerAudioVolumeNotify(event) {
    wx.$TUIRoomCore.playerAudioVolumeNotify(event);
  },
  onShareAppMessage() {
    return {
      path: 'pages/home/home',
      title: '腾讯视频云',
      imageUrl: 'https://qcloudimg.tencent-cloud.cn/raw/7955e99fa5c8f1badbab50ef87c935cf.png',
    };
  },
});
