import { ETUIRoomRole, ETUISpeechMode } from '../types.d';

class TUIRoomConfig {
  speechMode = ETUISpeechMode.APPLY_SPEECH; // 发言模式

  isChatRoomMuted = false; // 是否禁止IM聊天

  isSpeechApplicationForbidden = false; // 是否禁止申请发言

  isAllCameraMuted = false; // 是否全员禁摄像头

  isAllMicMuted = false; // 是否开启全员禁麦

  isCallingRoll = false; // 是否正在点名

  startTime = 0; // 开始时间

  reset() {
    this.speechMode = ETUISpeechMode.APPLY_SPEECH;
    this.isChatRoomMuted = false;
    this.isSpeechApplicationForbidden = false;
    this.isAllCameraMuted = false;
    this.isAllMicMuted = false;
    this.isCallingRoll = false;
    this.startTime = 0;
  }
}

export default TUIRoomConfig;
