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

  /// Indicates whether the microphone is muted.
  ///
  /// If set to `true`, the microphone will be muted. The default value is `false`.
  bool isMuteMicrophone;

  /// Indicates whether the camera is open.
  ///
  /// If set to `true`, the camera will be turned on. The default value is `false`.
  bool isOpenCamera;

  /// Indicates whether the sound is played through the speaker.
  ///
  /// If set to `true`, the sound will be played through the speaker. The default value is `true`.
  bool isSoundOnSpeaker;

  /// The name of the conference.
  ///
  /// This is an optional field. If not provided, the conference ID will be used as the name.
  /// Note: This parameter is only effective when creating a conference.
  String? name;

  /// Indicates whether the camera is enabled for all users.
  ///
  /// If set to `true`, all users will have their cameras enabled by default. The default value is `true`.
  /// Note: This parameter is only effective when creating a conference.
  bool enableCameraForAllUsers;

  /// Indicates whether the microphone is enabled for all users.
  ///
  /// If set to `true`, all users will have their microphones enabled by default. The default value is `true`.
  /// Note: This parameter is only effective when creating a conference.
  bool enableMicrophoneForAllUsers;

  /// Indicates whether messaging is enabled for all users.
  ///
  /// If set to `true`, all users will be able to send messages by default. The default value is `true`.
  /// Note: This parameter is only effective when creating a conference.
  bool enableMessageForAllUsers;

  /// Indicates whether the seat control mode is enabled.
  ///
  /// If set to `true`, the seat control mode will be enabled, allowing users to request to speak. The default value is `false`.
  /// Note: This parameter is only effective when creating a conference.
  bool enableSeatControl;
}
