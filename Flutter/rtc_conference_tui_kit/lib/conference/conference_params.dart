class ConferenceParams {
  ConferenceParams({
    this.isMuteMicrophone = true,
    this.isOpenCamera = false,
    this.isSoundOnSpeaker = true,
    this.name,
    this.enableCameraForAllUsers = true,
    this.enableMicrophoneForAllUsers = true,
    this.enableMessageForAllUsers = true,
    this.enableSeatControl = false,
  });

  bool isMuteMicrophone;
  bool isOpenCamera;
  bool isSoundOnSpeaker;

  String? name;
  bool enableCameraForAllUsers;
  bool enableMicrophoneForAllUsers;
  bool enableMessageForAllUsers;
  bool enableSeatControl;
}
