// https://web.sdk.qcloud.com/trtc/webrtc/doc/zh-cn/TRTC.html#.createStream
interface IStreamConfig {
  userId: string;
  audio: boolean;
  microphoneId?: string;
  video: boolean;
  cameraId?: string;
  // 指定使用前置或后置摄像头来采集视频。在移动设备上，可通过该参数选择使用前置或后置摄像头 'user': 前置; 'environment': 后置
  facingMode?: string;
  screen?: boolean;
  screenAudio: boolean;
  audioSource?: MediaStreamTrack;
  videoSource?: MediaStreamTrack;
  mirror?: boolean;
}

export { IStreamConfig };
