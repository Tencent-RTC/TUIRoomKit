import { TUISpeechMode } from '../types';

class TUIRoomConfig {
  speechMode = TUISpeechMode.FREE_SPEECH; // 发言模式

  isChatRoomMuted = false; // 是否禁止IM聊天

  isAllCameraMuted = false; // 是否全员禁摄像头

  isAllMicMuted = false; // 是否开启全员禁麦

  startTime = 0; // 开始时间

  reset() {
    this.speechMode = TUISpeechMode.FREE_SPEECH;
    this.isChatRoomMuted = false;
    this.isAllCameraMuted = false;
    this.isAllMicMuted = false;
    this.startTime = 0;
  }
}

export default TUIRoomConfig;
