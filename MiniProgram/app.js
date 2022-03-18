import { genTestUserSig } from './debug/GenerateTestUserSig';
import { tuiRoomCore } from './lib/TUIRoom/lib/index';
import Aegis from './lib/aegis'
App({
  onLaunch() {
    wx.$GenTestUserSig = genTestUserSig;
    wx.$TUIRoomCore = tuiRoomCore;
    this.globalData = {
      TUIScene: 'TUIRoom',
    };
    this.aegisInit()
    wx.aegis.reportEvent({
      name: 'onLaunch',
      ext1: 'onLaunch-success',
      ext2: 'wx-TUIRoom',
      ext3: genTestUserSig('').sdkAppID,
    })
  },
  aegisInit() {
    wx.aegis = new Aegis({
      id: 'iHWefAYqxqlqtLQVcA', // 项目key
      reportApiSpeed: true, // 接口测速
      reportAssetSpeed: true, // 静态资源测速
      pagePerformance: true, // 开启页面测速
    });
  },
});
