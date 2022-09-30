// import { TRTCQualityInfo, TRTCVolumeInfo } from "@trtc/cloud-sdk-types";

export type TRTCEvent = {
  onError: [code: number, msg: string];
  onEnterRoom: [delta: number];
  onExitRoom: [reason: -1 | 0 | 1 | 2]; // 0：主动调用 exitRoom 退房；1：被服务器踢出当前房间；2：当前房间整个被解散。
  onRemoteUserEnterRoom: [userId: string];
  onRemoteUserLeaveRoom: [userId: string, reason: 0 | 1 | 2]; // 0表示用户主动退出房间，1表示用户超时退出，2表示被踢出房间。
  onUserVideoAvailable: [userId: string, available: 0 | 1];
  onUserAudioAvailable: [userId: string, available: 0 | 1];
  onUserSubStreamAvailable: [userId: string, available: 0 | 1];
  // onUserVoiceVolume: [userVolumes: TRTCVolumeInfo[], userVolumesCount: number, totalVolume: number];
  onAudioDevicePlayoutVolumeChanged: [volume: number, muted: boolean];
  onCameraDidReady: [];
  onMicDidReady: [];
  onStartPublishCDNStream: [errCode: number, errMsg: string];
  onStopPublishCDNStream: [errCode: number, errMsg: string];
  onFirstAudioFrame: [];
  onFirstVideoFrame: [];
  onSendFirstLocalAudioFrame: [];
  onSendFirstLocalVideoFrame: [];
  onScreenCaptureStarted: [];
  onScreenCaptureStopped: [reason: number];

  // onNetworkQuality: [localQuality: TRTCQualityInfo, remoteQuality: TRTCQualityInfo[]];
  onConnectionLost: [];
  onTryToReconnect: [];
  onConnectionRecovery: [];
};
