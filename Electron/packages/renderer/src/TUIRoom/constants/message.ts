export enum WARNING_MESSAGE {
  UNMUTE_LOCAL_MIC_FAIL_MUTE_ALL = 'Has been fully muted and cannot open the microphone',
  UNMUTE_LOCAL_MIC_FAIL_MUTE_BY_MASTER = 'Has been muted by the host and cannot open the microphone',
  UNMUTE_LOCAL_MIC_FAIL_AUDIENCE = 'To apply to speak in the room, please raise your hand first to apply for the microphone',
  UNMUTE_LOCAL_CAMERA_FAIL_MUTE_ALL = 'Has been full static painting, can not open the video',
  UNMUTE_LOCAL_CAMERA_FAIL_MUTE_BY_MASTER = 'It has been stilled by the host and cannot open the video',
  UNMUTE_LOCAL_CAMERA_FAIL_AUDIENCE = 'To apply to speak in the room, please raise your hand first to apply for the microphone',
};

export enum MESSAGE_DURATION {
  NORMAL = 3000,
  LONG = 5000
};
