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
  'Microphone.Title': 'Audio',
  'Microphone.Disabled': 'Has been fully muted and cannot open the microphone',
  'Camera.Title': 'Video',
  'Camera.Disabled': 'Has been full static painting, can not open the camera',
  'ScreenShare': {
    Title: 'Screen share',
    EndSharing: 'End sharing',
    StartSharing: 'Start sharing',
    StopSharingConfirm: 'Others will no longer see your screen after you stop sharing. Are you sure you want to stop?',
    StartSharingConfirm: 'Sharing screens may lead to the leakage of private information such as SMS verification codes and passwords, resulting in financial losses. Please be vigilant against various forms of fraud.',
    NotAllowedToShareScreen: 'Failed to initiate screen sharing, currently only host/admin can share screen.',
    AnotherIsSharingTheScreen: 'Another user is sharing the screen.',
    BrowserDoesNotSupportScreenSharing: 'The current browser does not support screen sharing',
    SystemProhibitsAccessScreenContent: 'The system prohibits the current browser from accessing the screen content, please enable the screen sharing privilege.',
    UserCanceledScreenSharing: 'User canceled screen sharing',
    UnknownErrorOccurredWhileSharing: 'An unknown error occurred while screen sharing, please try again.',
  },
  'Participant': {
    Title: 'Participants',
  },
  'Setting': {
    Title: 'Setting',
    AudioSetting: 'Audio setting',
    VideoSetting: 'Video setting',
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

  // LoginUserInfo
  'LoginUserInfo.Logout': 'Logout',
  'LoginUserInfo.LogoutSuccess': 'Logout successful',
  'LoginUserInfo.LogoutFailed': 'Logout failed',

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
  'Room.InviteToMeeting': '{{userName}} invites you to join the meeting',
  'Room.PasswordRequired': 'Password required',
  'Room.EnterPassword': 'Please enter room password',
  'Room.EnterPasswordPlaceholder': 'Please enter room password',
  'Room.JoinFailed': 'Failed to join room',
  'Room.InvalidPassword': 'Wrong password',
  'Room.RoomNotFound': 'Room does not exist, please check the room ID or create a new room!',
  'Room.RoomFull': 'Room is full, unable to join',
  'Room.JoinRoomError': 'Failed to join room, please try again later',
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
  'Room.LeaveRoomTitle': 'Leave Room',
  'Room.LeaveRoomTip': 'You are currently the room host. Please select the appropriate action. If you select "End Room," the current room will be disbanded and all members will be removed.',
  'Room.EndRoom': 'End Room',
  'Room.LeaveRoomFailed': 'Failed to leave room',
  'Room.EndRoomFailed': 'Failed to end room',
  'Room.TransferFailed': 'Failed to transfer host',
  'Room.TransferSuccessAndLeave': 'Host transferred to {{name}}',
  'Room.RoomEnded': 'The host has ended the meeting and the room has been disbanded',
  'Room.Notify': 'Notify',
  'Room.TemporaryMeeting': '\'s temporary meeting',
  'Room.RoomIdRequired': 'Room ID is required',
  'Room.RoomOccupied': 'Room already exists, cannot be created again',

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
  'Copy Failed': 'Copy Failed',

  // Button
  'Button.CreateRoom': 'Create',
  'Button.JoinRoom': 'Join',
  'Button.ScheduleRoom': 'Schedule',
  'Button.EnterRoomId': 'Enter room ID',
  'Button.ScheduleMeeting': 'Schedule Meeting',
  'Button.PleaseLoginFirst': 'Please login first',

  // RoomChat
  'RoomChat.disabled_placeholder': 'You have been muted, unable to send messages',
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
    AllMicrophonesDisabled: 'All participants have been muted',
    AllMicrophonesEnabled: 'All participants have been unmuted',
    AllCamerasDisabled: 'All cameras have been disabled',
    AllCamerasEnabled: 'All cameras have been enabled',
    AllScreenSharesDisabled: 'Screen sharing has been disabled for all participants',
    AllScreenSharesEnabled: 'Screen sharing has been enabled for all participants',

    // All messages control
    AllMessagesDisabled: 'Chat has been disabled for all participants',
    AllMessagesEnabled: 'Chat has been enabled for all participants',

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
};
