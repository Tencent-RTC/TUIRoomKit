export const resource = {
  'RoomCommon': {
    Notification: 'Notification',
    Attention: 'Attention',
  },
  'Theme.Title': 'Theme',
  'Language.Title': 'Language',
  'Layout': {
    Title: 'Layout',
    Grid: 'Grid',
    GalleryRight: 'Gallery on right',
    GalleryTop: 'Gallery at top',
  },
  'Network': {
    Title: 'Network',
    Unknown: 'Unknown',
    Stability: 'Stability',
    Fluctuation: 'Fluctuation',
    Lag: 'Lag',
    Disconnected: 'Disconnected',
    Latency: 'Latency',
    PacketLoss: 'Loss',
  },
  'Microphone': {
    Mute: 'Mute',
    Unmute: 'Unmute',
    Disabled: 'Muted by host. Unmute disabled.',
    NotSupportCapture: 'Browser doesn\'t support microphone. Try another browser.',
    NoSystemPermission: 'Microphone access denied. Please grant permission.',
    OccupiedError: 'Microphone in use. Close other apps and refresh.',
    NoDeviceDetected: 'No microphone detected.',
    UnknownError: 'Microphone failed. Please check and refresh.',
  },
  'Camera': {
    Start: 'Start video',
    Stop: 'Stop video',
    Disabled: 'Video disabled. Cannot start video.',
    NotSupportCapture: 'Browser doesn\'t support camera. Try another browser.',
    NoSystemPermission: 'Camera access denied. Please grant permission.',
    OccupiedError: 'Camera in use. Close other apps and refresh.',
    NoDeviceDetected: 'No camera detected.',
    UnknownError: 'Camera failed. Please check and refresh.',
  },
  'ScreenShare': {
    Title: 'Screen share',
    EndSharing: 'End sharing',
    StartSharing: 'Start sharing',
    StopSharingConfirm: 'Others will no longer see your screen after you stop sharing. Are you sure you want to stop?',
    StartSharingConfirm: 'Sharing screens may lead to the leakage of private information such as SMS verification codes and passwords, resulting in financial losses. Please be vigilant against various forms of fraud.',
    NotAllowedToShareScreen: 'Currently only host/admin can share screen.',
    AnotherIsSharingTheScreen: 'Another user is sharing the screen.',
    BrowserDoesNotSupportScreenSharing: 'The current browser does not support screen sharing',
    SystemProhibitsAccessScreenContent: 'The system prohibits the current browser from accessing the screen content, please enable the screen sharing privilege.',
    UserCanceledScreenSharing: 'User canceled screen sharing',
    UnknownErrorOccurredWhileSharing: 'An unknown error occurred while screen sharing, please try again.',
  },
  'Participant': {
    Title: 'People',
  },
  'Setting': {
    Title: 'Setting',
    AudioSetting: 'Audio setting',
    VideoSetting: 'Video setting',
    OtherSetting: 'Other Setting',
    Resolution: 'Resolution',
    LocalMirror: 'Local Mirror',
    QualityCheck: 'Quality Check',
    NetworkQuality: 'Network Quality',
    LowDefinition: 'Low Definition',
    StandardDefinition: 'Standard Definition',
    HighDefinition: 'High Definition',
    SuperDefinition: 'Super Definition',
    SetMirrorSuccess: 'Set mirror success',
    CancelMirrorSuccess: 'Cancel mirror success',
  },
  // RoomInvitation
  'RoomInvitation.InviteText': '{{name}} invites you to join the meeting',
  'RoomInvitation.Host': 'Host: ',
  'RoomInvitation.Participants': 'Participants: ',
  'RoomInvitation.ParticipantsUnit': 'people',
  'RoomInvitation.NotJoin': 'Not Join',
  'RoomInvitation.JoinMeeting': 'Join Meeting',
  'RoomInvitation.HandleByOtherDevice': 'Invitation has been received by other device',

  // VirtualBackground
  'VirtualBackground.Title': 'Virtual Background',
  'VirtualBackground.Close': 'Close',
  'VirtualBackground.Blurred': 'Blurred',
  'VirtualBackground.Save': 'Save',
  'VirtualBackground.Cancel': 'Cancel',
  'VirtualBackground.NotSupported': 'Virtual background is not supported in current browser',
  'VirtualBackground.NoCamera': 'No camera detected',

  // CurrentRoomInfo
  'CurrentRoomInfo.Host': 'Host',
  'CurrentRoomInfo.RoomId': 'Room ID',
  'CurrentRoomInfo.RoomLink': 'Room Link',
  'CurrentRoomInfo.Copy': 'Copy',
  'CurrentRoomInfo.Password': 'Room Password',
  'CurrentRoomInfo.PasswordH5': 'Password',

  // LoginUserInfo
  'LoginUserInfo.Logout': 'Logout',
  'LoginUserInfo.LogoutSuccess': 'Logout successful',
  'LoginUserInfo.LogoutFailed': 'Logout failed',

  // User
  'User.Nickname': 'Your Nickname',

  // Chat
  'Chat.Title': 'Chat',

  // BasicBeauty
  'BasicBeauty.Title': 'Basic Beauty',
  'BasicBeauty.NoCamera': 'No camera detected',

  'RoomMore.Title': 'More',

  // Invite
  'Invite.Title': 'Invite',
  'Invite.AddMember': 'Add Member',
  'Invite.ShareRoom': 'Share Room',
  'Invite.InviteSuccess': 'Invitation sent, waiting for members to join',
  'Invite.InviteFailed': 'Failed to invite members',
  'Invite.PleaseSelectUser': 'Please select the user to invite',

  // Room
  'Room.LeaveRoom': 'Leave Room',
  'Room.End': 'End',
  'Room.InviteToMeeting': '{{userName}} invites you to join the meeting',
  'Room.PasswordRequired': 'Password required',
  'Room.EnterPassword': 'Please enter room password',
  'Room.EnterPasswordPlaceholder': 'Please enter room password',
  'Room.JoinFailed': 'Failed to join room',
  'Room.InvalidPassword': 'Wrong password',
  'Room.RoomNotFound': 'Room does not exist, please check the room ID or create a new room!',
  'Room.RoomFull': 'Room is full, unable to join',
  'Room.JoinRoomError': 'Failed to join room, please try again later',
  'Room.CreateRoomError': 'Failed to create room, please try again later',
  'Room.EnteringRoom': 'Entering the room now...',
  'Room.Confirm': 'Confirm',
  'Room.Cancel': 'Cancel',
  'Room.Alert': 'Alert',
  'Room.SelectNewHost': 'Select New Host',
  'Room.PleaseSelectNewHost': 'Please select new host',
  'Room.TransferAndLeave': 'Transfer and Leave',
  'Room.ConfirmLeaveTitle': 'Confirm Leave Room',
  'Room.ConfirmLeaveTip': 'You are currently the room host. Please select the appropriate action. If you select "End Room," the current room will be disbanded and all members will be removed. If you select "Leave Room," the current room will not be disbanded, and your host privileges will be transferred to another member.',
  'Room.ConfirmLeavePage': 'Are you sure you want to leave this page? You will exit the current room',
  'Room.ConfirmLeaveRoom': 'Are you sure you want to leave this room?',
  'Room.LeaveRoomTitle': 'Leave Room',
  'Room.LeaveRoomTip': 'You are currently the room host. Please select the appropriate action. If you select "End Room," the current room will be disbanded and all members will be removed.',
  'Room.EndRoom': 'End Room',
  'Room.LeaveRoomFailed': 'Failed to leave room',
  'Room.EndRoomFailed': 'Failed to end room',
  'Room.TransferAndLeaveFailed': 'Failed to transfer host and leave',
  'Room.TransferSuccessAndLeave': 'Host transferred to {{name}}',
  'Room.RoomEnded': 'The host has ended the meeting and the room has been disbanded',
  'Room.Notify': 'Notify',
  'Room.TemporaryMeeting': '\'s temporary meeting',
  'Room.RoomIdRequired': 'Room ID is required',
  'Room.RoomOccupied': 'Room already exists, cannot be created again',
  'Room.RoomId': 'Room ID',
  'Room.EnterRoomId': 'Please enter room ID',
  'Room.OpenMicrophone': 'Open Microphone',
  'Room.OpenSpeaker': 'Open Speaker',
  'Room.OpenCamera': 'Open Camera',

  // RoomShare
  'RoomShare.NoRoomInfo': 'No room information',
  'RoomShare.RoomName': 'Room Name',
  'RoomShare.RoomTime': 'Room Time',
  'RoomShare.RoomId': 'Room ID',
  'RoomShare.Password': 'Room Password',
  'RoomShare.RoomLink': 'Room Link',
  'RoomShare.RoomSchemeLink': 'Scheme Link',
  'RoomShare.RoomIdNotFound': 'Room ID not found',
  'RoomShare.CopyMeetingIdAndLink': 'Copy Meeting ID and Link',
  'RoomShare.BookingSuccess': 'Booking successful, invite members to join',
  'RoomShare.InviteByRoomNumber': 'Invite by room number',
  'RoomShare.InviteByRoomLink': 'Invite by room link',
  'Copy Success': 'Copy Success',
  'Copy Failed': 'Copy failed, the current device does not support copying',

  // Button
  'Button.CreateRoom': 'Create',
  'Button.JoinRoom': 'Join',
  'Button.ScheduleRoom': 'Schedule',
  'Button.EnterRoomId': 'Enter room ID',
  'Button.ScheduleMeeting': 'Schedule Meeting',
  'Button.PleaseLoginFirst': 'Please login first',

  // RoomChat
  'RoomChat.disabled_placeholder': 'You have been muted',
  'RoomChat.input_placeholder': 'Please enter a message...',

  'Settings.Title': 'Settings',
  'Off Camera': 'Off Camera',
  'Contacts': 'Contacts',
  'Confirm': 'Confirm',

  'RoomView': {
    IsSharingTheirScreen: 'is sharing their screen',
    YouAreSharingTheScreen: 'You are sharing the screen...',
    EndSharing: 'End sharing',
  },

  // RoomNotifications
  'RoomNotifications': {
    // Role related
    BecomeOwner: 'You have been promoted to room owner',
    BecomeAdmin: 'You have been promoted to administrator',
    AdminRevoked: 'Your administrator privileges have been revoked',

    // Kicked out of room
    KickedByAdmin: 'You have been removed from the room by the host',
    ReplacedByAnotherDevice: 'Your account has been logged in on another device',
    KickedByServer: 'You have been removed from the room by the server',
    ConnectionTimeout: 'Connection timeout. Leaving the room',
    InvalidStatusOnReconnect: 'The room has been disbanded or you have been removed while offline',
    RoomLimitExceeded: 'Room limit exceeded. Unable to join',
    DefaultKickedOut: 'You have been removed from the room',

    // Device closed by operator
    MicrophoneClosed: 'Your microphone has been disabled by the host',
    CameraClosed: 'Your camera has been disabled by the host',
    ScreenShareClosed: 'Your screen sharing has been stopped by the host',

    // Message muted/unmuted
    MessageMuted: 'Your messaging has been disabled by the host',
    MessageUnmuted: 'Your messaging has been enabled by the host',

    // All devices control
    AllMicrophonesDisabled: 'Participants muted. Mic access disabled.',
    AllMicrophonesEnabled: 'Participants can now unmute themselves.',
    AllCamerasDisabled: 'Participants\' video off. Camera access disabled.',
    AllCamerasEnabled: 'Participants can now start video.',
    AllScreenSharesDisabled: 'Screen sharing disabled for participants.',
    AllScreenSharesEnabled: 'Screen sharing enabled for participants.',

    // All messages control
    AllMessagesDisabled: 'Chat disabled for participants.',
    AllMessagesEnabled: 'Chat enabled for participants.',

    // Device Invitation
    MicrophoneInvitationReceived: '{{ senderName }} is inviting you to unmute your microphone',
    CameraInvitationReceived: '{{ senderName }} is inviting you to enable your camera',
    ScreenShareInvitationReceived: '{{ senderName }} is inviting you to enable your screen sharing',

    OpenMicrophone: 'Open Microphone',
    OpenCamera: 'Open Camera',
    OpenScreenShare: 'Open Screen Share',
    KeepOff: 'Keep Off',

    AudioPlaybackFailed: 'Audio playback failed. Click the "Confirm" to resume playback',
  },
  'AITools': {
    Title: 'AI Tools',
    RealtimeMessageList: 'AI Real-time Meeting Minutes',
    SubtitlesOpen: 'Open AI Real-time Subtitles',
    RealtimeMessageListOpen: 'Open AI Real-time Meeting Minutes',
    SubtitlesClose: 'Close AI Real-time Subtitles',
    RealtimeMessageListClose: 'Close AI Real-time Meeting Minutes',
  },
};
