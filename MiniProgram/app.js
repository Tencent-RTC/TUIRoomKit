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
    this.aegisReportEvent('onLaunch', 'onLaunch-success')
  },
  aegisInit() {
    wx.aegis = new Aegis({
      id: 'iHWefAYqxqlqtLQVcA', // 项目key
      reportApiSpeed: true, // 接口测速
      reportAssetSpeed: true, // 静态资源测速
      pagePerformance: true, // 开启页面测速
    });
  },
  aegisReportEvent(name, ext1) {
    if (!this.aegisReportEvent[name] || !this.aegisReportEvent[name][ext1]) {
      wx.aegis.reportEvent({
        name,
        ext1,
        ext2: 'wxTUIRoomExternal',
        ext3: genTestUserSig('').sdkAppID,
      });
      if(typeof this.aegisReportEvent[name] !== 'object') {
        this.aegisReportEvent[name] = {};
      }
      this.aegisReportEvent[name][ext1] = true;
    }
  },
});
