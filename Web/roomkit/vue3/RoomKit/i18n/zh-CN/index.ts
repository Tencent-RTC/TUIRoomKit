export const resource = {
  'RoomCommon': {
    Notification: '通知',
    Attention: '注意',
  },
  'Theme.Title': '主题',
  'Language.Title': '语言',
  'Layout': {
    Title: '布局',
    Grid: '一屏九等分',
    GalleryRight: '右侧成员列表',
    GalleryTop: '顶部成员列表',
  },
  'Network': {
    Title: '网络',
    Unknown: '未知',
    Stability: '稳定',
    Fluctuation: '波动',
    Lag: '卡顿',
    Disconnected: '断开',
    Latency: '延迟',
    PacketLoss: '丢包率',
  },
  'Microphone': {
    Mute: '静音',
    Unmute: '取消静音',
    Disabled: '全员静音中，无法解除静音',
    NotSupportCapture: '浏览器不支持麦克风采集，请换用其他浏览器',
    NoSystemPermission: '麦克风权限未授权，请允许访问',
    OccupiedError: '麦克风被占用，请关闭其他应用后刷新',
    NoDeviceDetected: '未检测到麦克风',
    UnknownError: '麦克风采集失败，请检查后刷新',
  },
  'Camera': {
    Start: '打开视频',
    Stop: '关闭视频',
    Disabled: '全员禁画中，无法开启摄像头',
    NotSupportCapture: '浏览器不支持摄像头采集，请换用其他浏览器',
    NoSystemPermission: '摄像头权限未授权，请允许访问',
    OccupiedError: '摄像头被占用，请关闭其他应用后刷新',
    NoDeviceDetected: '未检测到摄像头',
    UnknownError: '摄像头采集失败，请检查后刷新',
  },
  'ScreenShare': {
    Title: '屏幕分享',
    EndSharing: '结束共享',
    StartSharing: '开始共享',
    StopSharingConfirm: '结束共享后，其他人将无法继续观看你的屏幕内容，确定要结束共享吗？',
    StartSharingConfirm: '共享屏幕可能会导致私人信息（如短信验证码、密码等）泄露，造成经济损失。请提高警惕，防范各种形式的诈骗。',
    NotAllowedToShareScreen: '当前仅主持人/管理员可以共享屏幕。',
    AnotherIsSharingTheScreen: '其他用户正在共享屏幕。',
    BrowserDoesNotSupportScreenSharing: '当前浏览器不支持屏幕分享',
    SystemProhibitsAccessScreenContent: '系统禁止当前浏览器访问屏幕内容，请启用屏幕共享权限。',
    UserCanceledScreenSharing: '用户取消屏幕共享',
    UnknownErrorOccurredWhileSharing: '屏幕共享过程中发生未知错误，请重试。',
  },
  'Participant': {
    Title: '成员',
  },
  'Setting': {
    Title: '设置',
    AudioSetting: '音频设置',
    VideoSetting: '视频设置',
    OtherSetting: '其他设置',
    Resolution: '分辨率',
    LocalMirror: '本地镜像',
    QualityCheck: '质量检测',
    NetworkQuality: '网络质量',
    LowDefinition: '流畅',
    StandardDefinition: '标清',
    HighDefinition: '高清',
    SuperDefinition: '超清',
    SetMirrorSuccess: '镜像已开启',
    CancelMirrorSuccess: '镜像已关闭',
  },

  // RoomInvitation
  'RoomInvitation.InviteText': '{{name}}邀请你加入会议',
  'RoomInvitation.Host': '房主：',
  'RoomInvitation.Participants': '参会人：',
  'RoomInvitation.ParticipantsUnit': '人',
  'RoomInvitation.NotJoin': '暂不加入',
  'RoomInvitation.JoinMeeting': '加入会议',
  'RoomInvitation.HandleByOtherDevice': '邀请已被其他设备接收',

  // VirtualBackground
  'VirtualBackground.Title': '虚拟背景',
  'VirtualBackground.Close': '关闭',
  'VirtualBackground.Blurred': '模糊',
  'VirtualBackground.Save': '保存',
  'VirtualBackground.Cancel': '取消',
  'VirtualBackground.NotSupported': '当前浏览器不支持虚拟背景功能',
  'VirtualBackground.NoCamera': '未检测到摄像头',

  // CurrentRoomInfo
  'CurrentRoomInfo.Host': '房主',
  'CurrentRoomInfo.RoomId': '房间号',
  'CurrentRoomInfo.RoomLink': '房间链接',
  'CurrentRoomInfo.Copy': '复制',
  'CurrentRoomInfo.Password': '房间密码',
  'CurrentRoomInfo.PasswordH5': '房间密码',

  // LoginUserInfo
  'LoginUserInfo.Logout': '退出登录',
  'LoginUserInfo.LogoutSuccess': '退出登录成功',
  'LoginUserInfo.LogoutFailed': '退出登录失败',

  // User
  'User.Nickname': '您的姓名',

  // Chat
  'Chat.Title': '聊天',

  // BasicBeauty
  'BasicBeauty.Title': '基础美颜',
  'BasicBeauty.NoCamera': '未检测到摄像头',

  'RoomMore.Title': '更多',

  // Invite
  'Invite.Title': '邀请',
  'Invite.AddMember': '添加成员',
  'Invite.ShareRoom': '分享房间',
  'Invite.InviteSuccess': '邀请信息已发出，等待成员加入',
  'Invite.InviteFailed': '邀请成员失败',
  'Invite.PleaseSelectUser': '请选择要邀请的成员',

  // Room
  'Room.LeaveRoom': '离开房间',
  'Room.End': '结束',
  'Room.InviteToMeeting': '{{userName}} 邀请您加入会议',
  'Room.PasswordRequired': '需要进房密码',
  'Room.EnterPassword': '请输入房间密码',
  'Room.EnterPasswordPlaceholder': '请输入入会密码',
  'Room.JoinFailed': '加入房间失败',
  'Room.InvalidPassword': '密码错误',
  'Room.RoomNotFound': '房间不存在，请确认房间号或创建房间！',
  'Room.RoomFull': '房间已满，无法加入',
  'Room.JoinRoomError': '加入房间失败，请稍后重试',
  'Room.CreateRoomError': '创建房间失败，请稍后重试',
  'Room.EnteringRoom': '正在进入房间...',
  'Room.Confirm': '确定',
  'Room.Cancel': '取消',
  'Room.Alert': '提示',
  'Room.SelectNewHost': '选择新主持人',
  'Room.PleaseSelectNewHost': '请选择新主持人',
  'Room.TransferAndLeave': '移交并离开',
  'Room.ConfirmLeaveTitle': '是否要离开房间',
  'Room.ConfirmLeaveTip': '您当前是房间主持人，请选择相应操作。若选择"结束房间"，将解散当前房间并将全体成员移出。若选择"离开房间"，当前房间不会解散，您的主持人权限将移交给其他成员。',
  'Room.ConfirmLeavePage': '您确定要离开当前页面么？离开后将会退出当前房间',
  'Room.ConfirmLeaveRoom': '您确定要离开当前房间么？',
  'Room.LeaveRoomTitle': '离开房间',
  'Room.LeaveRoomTip': '您当前是房间主持人，请选择相应操作。若选择"结束房间"，将解散当前房间并将全体成员移出。',
  'Room.EndRoom': '结束房间',
  'Room.LeaveRoomFailed': '离开房间失败',
  'Room.EndRoomFailed': '结束房间失败',
  'Room.TransferAndLeaveFailed': '转移主持人并离开失败',
  'Room.TransferSuccessAndLeave': '已将主持人转移给 {{name}}',
  'Room.RoomEnded': '主持人结束会议，已解散房间',
  'Room.Notify': '通知',
  'Room.TemporaryMeeting': '的临时房间',
  'Room.RoomIdRequired': '房间号不能为空',
  'Room.RoomOccupied': '房间已存在，无法再次创建',
  'Room.RoomId': '房间号',
  'Room.EnterRoomId': '请输入房间号',
  'Room.OpenMicrophone': '开启麦克风',
  'Room.OpenSpeaker': '开启扬声器',
  'Room.OpenCamera': '开启视频',

  // RoomShare
  'RoomShare.NoRoomInfo': '暂无房间信息',
  'RoomShare.RoomName': '房间名称',
  'RoomShare.RoomTime': '房间时间',
  'RoomShare.RoomId': '房间号',
  'RoomShare.Password': '房间密码',
  'RoomShare.RoomLink': '房间链接',
  'RoomShare.RoomSchemeLink': 'Scheme链接',
  'RoomShare.RoomIdNotFound': '未找到房间号',
  'RoomShare.CopyMeetingIdAndLink': '复制会议号与链接',
  'RoomShare.BookingSuccess': '预订成功, 邀请成员加入',
  'RoomShare.InviteByRoomNumber': '通过房间号邀请',
  'RoomShare.InviteByRoomLink': '通过房间链接邀请',
  'Copy Success': '复制成功',
  'Copy Failed': '复制失败，当前设备不支持复制',

  // Button
  'Button.CreateRoom': '新建房间',
  'Button.JoinRoom': '加入房间',
  'Button.ScheduleRoom': '预定房间',
  'Button.EnterRoomId': '输入房间号',
  'Button.ScheduleMeeting': '预约会议',
  'Button.PleaseLoginFirst': '请先登录',

  // RoomChat
  'RoomChat.disabled_placeholder': '您已被禁言，无法发送消息',
  'RoomChat.input_placeholder': '请输入消息...',

  'Settings.Title': '设置',
  'Off Camera': '摄像头已关闭',
  'Contacts': '联系人',
  'Confirm': '确认',

  'RoomView': {
    IsSharingTheirScreen: '正在共享屏幕',
    YouAreSharingTheScreen: '您正在共享屏幕...',
    EndSharing: '结束共享',
  },

  // RoomNotifications
  'RoomNotifications': {
    // Role related
    BecomeOwner: '您已被设为房主',
    BecomeAdmin: '您已被设为管理员',
    AdminRevoked: '您的管理员权限已被撤销',

    // Kicked out of room
    KickedByAdmin: '您已被主持人移出房间',
    ReplacedByAnotherDevice: '您的账号已在其他设备登录',
    KickedByServer: '您已被服务器移出房间',
    ConnectionTimeout: '网络连接超时，正在退出房间',
    InvalidStatusOnReconnect: '房间已解散或您在离线期间已被移出',
    RoomLimitExceeded: '房间人数已达上限，无法加入',
    DefaultKickedOut: '您已被移出房间',

    // Device closed by operator
    MicrophoneClosed: '主持人已关闭你的麦克风',
    CameraClosed: '主持人已关闭你的摄像头',
    ScreenShareClosed: '主持人已停止你的屏幕共享',

    // Message muted/unmuted
    MessageMuted: '您已被主持人禁止文字聊天',
    MessageUnmuted: '您的文字聊天权限已被主持人恢复',

    // All devices control
    AllMicrophonesDisabled: '已静音所有成员，麦克风已禁用',
    AllMicrophonesEnabled: '已允许成员开启麦克风',
    AllCamerasDisabled: '已关闭所有成员视频，摄像头已禁用',
    AllCamerasEnabled: '已允许成员开启视频',
    AllScreenSharesDisabled: '已禁止成员屏幕共享',
    AllScreenSharesEnabled: '已允许成员开启屏幕共享',

    // All messages control
    AllMessagesDisabled: '已禁止成员文字聊天',
    AllMessagesEnabled: '已允许成员文字聊天',

    // Device invitation
    MicrophoneInvitationReceived: '{{ senderName }}邀请您开启麦克风',
    CameraInvitationReceived: '{{ senderName }}邀请您开启摄像头',
    ScreenShareInvitationReceived: '{{ senderName }}邀请您开启屏幕共享',

    OpenMicrophone: '开启麦克风',
    OpenCamera: '开启摄像头',
    OpenScreenShare: '开启屏幕共享',
    KeepOff: '保持关闭',

    AudioPlaybackFailed: '音频播放失败，点击“确认”继续播放',
  },
  'AITools': {
    Title: 'AI 工具',
    RealtimeMessageList: 'AI 实时会议记录',
    SubtitlesOpen: '开启 AI 实时字幕',
    RealtimeMessageListOpen: '开启 AI 实时会议记录',
    SubtitlesClose: '关闭 AI 实时字幕',
    RealtimeMessageListClose: '关闭 AI 实时会议记录',
  },
};
