import TUIRoomCore from '../../../lib/TUIRoom/lib/index';
Page({
  data: {
    userName: '',
    roomId: Number.parseInt(String(Math.random() * 10000), 10),
    enableCamera: false,
    enableMic: true,
  },
  enableCamera(e) {
    this.setData({ enableCamera: e.detail.value });
  },
  enableMic(e) {
    this.setData({ enableMic: e.detail.value });
  },
  async createRoom() {
    if (this.checkParams()) {
      const { userSig, sdkAppID } = wx.$GenTestUserSig(this.data.userName);
      if (wx.$TUIRoomCore.isLogin) {
        // 登录过需要先登出重新登录
        await wx.$TUIRoomCore.logout();
      }
      wx.$TUIRoomCore = new TUIRoomCore();
      await wx.$TUIRoomCore.login(sdkAppID, this.data.userName, userSig);
      wx.$TUIRoomCore
        .createRoom(String(this.data.roomId))
        .then(() => {
          wx.navigateTo({
            url: `../room/room?roomId=${this.data.roomId}&enableCamera=${this.data.enableCamera}&enableMic=${this.data.enableMic}`,
          });
        })
        .catch((e) => {
          console.dir(e);
          wx.showToast({
            title: e.message,
            icon: 'none',
          });
        });
    }
  },
  checkParams() {
    if (this.data.userName === '') {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none',
      });
      return false;
    }
    if (this.data.roomId === '') {
      wx.showToast({
        title: '请输入房间号',
        icon: 'none',
      });
      return false;
    }
    return true;
  },
  onShareAppMessage() {
    return {
      path: 'pages/home/home',
      title: '腾讯视频云',
      imageUrl: 'https://qcloudimg.tencent-cloud.cn/raw/7955e99fa5c8f1badbab50ef87c935cf.png',
    };
  },
});
