import { genTestUserSig } from './debug/GenerateTestUserSig';
import { tuiRoomCore } from './lib/TUIRoom/lib/index';

App({
  onLaunch() {
    wx.$GenTestUserSig = genTestUserSig;
    wx.$TUIRoomCore = tuiRoomCore;
    this.globalData = {
      TUIScene: 'TUIRoom',
    };
  },
});
