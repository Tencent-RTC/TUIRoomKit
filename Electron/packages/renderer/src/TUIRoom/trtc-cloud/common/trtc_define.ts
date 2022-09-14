/* eslint-disable */
/**
 * TRTC 关键类型定义<br>
 * @description 分辨率、质量等级等枚举和常量值的定义
 */
/////////////////////////////////////////////////////////////////////////////////
//
//                    【（一）视频相关枚举值定义】
//
/////////////////////////////////////////////////////////////////////////////////
/**
 * 视频分辨率<br>
 * 此处仅定义了横屏分辨率，如果要使用360 × 640这样的竖屏分辨率，需要同时指定 TRTCVideoResolutionMode 为 Portrait。
 * @enum {Number}
 */
const TRTCVideoResolution_HACK_JSDOC = {
  /// 宽高比1:1
  /** [C] 建议码率80kbps */
  TRTCVideoResolution_120_120: 1,
  /** [C] 建议码率100kbps */
  TRTCVideoResolution_160_160: 3,
  /** [C] 建议码率200kbps */
  TRTCVideoResolution_270_270: 5,
  /** [C] 建议码率350kbps */
  TRTCVideoResolution_480_480: 7,

  /// 宽高比4:3
  /** [C] 建议码率100kbps */
  TRTCVideoResolution_160_120: 50,
  /** [C] 建议码率150kbps */
  TRTCVideoResolution_240_180: 52,
  /** [C] 建议码率200kbps */
  TRTCVideoResolution_280_210: 54,
  /** [C] 建议码率250kbps */
  TRTCVideoResolution_320_240: 56,
  /** [C] 建议码率300kbps */
  TRTCVideoResolution_400_300: 58,
  /** [C] 建议码率400kbps */
  TRTCVideoResolution_480_360: 60,
  /** [C] 建议码率600kbps */
  TRTCVideoResolution_640_480: 62,
  /** [C] 建议码率1000kbps */
  TRTCVideoResolution_960_720: 64,

  /// 宽高比16:9
  /** [C] 建议码率150kbps */
  TRTCVideoResolution_160_90: 100,
  /** [C] 建议码率200kbps */
  TRTCVideoResolution_256_144: 102,
  /** [C] 建议码率250kbps */
  TRTCVideoResolution_320_180: 104,
  /** [C] 建议码率350kbps */
  TRTCVideoResolution_480_270: 106,
  /** [C] 建议码率550kbps */
  TRTCVideoResolution_640_360: 108,
  /** [C] 建议码率850kbps */
  TRTCVideoResolution_960_540: 110,
  /**
   * [C] 摄像头采集 - 建议码率1200kbps<br>
   * [S] 屏幕分享   - 建议码率 低清：1000kbps 高清：1600kbps
   */
  TRTCVideoResolution_1280_720: 112,
  /** [S] 屏幕分享   - 建议码率2000kbps */
  TRTCVideoResolution_1920_1080: 114,
};
export enum TRTCVideoResolution {
  TRTCVideoResolution_120_120 = 1,
  TRTCVideoResolution_160_160 = 3,
  TRTCVideoResolution_270_270 = 5,
  TRTCVideoResolution_480_480 = 7,
  TRTCVideoResolution_160_120 = 50,
  TRTCVideoResolution_240_180 = 52,
  TRTCVideoResolution_280_210 = 54,
  TRTCVideoResolution_320_240 = 56,
  TRTCVideoResolution_400_300 = 58,
  TRTCVideoResolution_480_360 = 60,
  TRTCVideoResolution_640_480 = 62,
  TRTCVideoResolution_960_720 = 64,
  TRTCVideoResolution_160_90 = 100,
  TRTCVideoResolution_256_144 = 102,
  TRTCVideoResolution_320_180 = 104,
  TRTCVideoResolution_480_270 = 106,
  TRTCVideoResolution_640_360 = 108,
  TRTCVideoResolution_960_540 = 110,
  TRTCVideoResolution_1280_720 = 112,
  TRTCVideoResolution_1920_1080 = 114,
}
/**
 * 视频流类型<br>
 * TRTC 内部有三种不同的音视频流，分别是：
 * - 主画面：最常用的一条线路，一般用来传输摄像头的视频数据。
 * - 小画面：跟主画面的内容相同，但是分辨率和码率更低。
 * - 辅流画面：一般用于屏幕分享，以及远程播片（比如老师放一段视频给学生）。
 * 注意:
 * - 如果主播的上行网络和性能比较好，则可以同时送出大小两路画面。
 * - SDK 不支持单独开启小画面，小画面必须依附于主画面而存在。
 * @enum {Number}
 */
const TRTCVideoStreamType_HACK_JSDOC = {
  /** 大画面视频流 */
  TRTCVideoStreamTypeBig: 0,
  /** 小画面视频流 */
  TRTCVideoStreamTypeSmall: 1,
  /** 辅流（屏幕分享） */
  TRTCVideoStreamTypeSub: 2,
};
export enum TRTCVideoStreamType {
  TRTCVideoStreamTypeBig = 0,
  TRTCVideoStreamTypeSmall = 1,
  TRTCVideoStreamTypeSub = 2,
}
/**
 * 视频画面填充模式<br>
 * 如果画面的显示分辨率不等于画面的原始分辨率，就需要您设置画面的填充模式:
 * - TRTCVideoFillMode_Fill，图像铺满屏幕，超出显示视窗的视频部分将被截掉，所以画面显示可能不完整。
 * - TRTCVideoFillMode_Fit，图像长边填满屏幕，短边区域会被填充黑色，但画面的内容肯定是完整的。
 * @enum {Number}
 */
const TRTCVideoFillMode_HACK_JSDOC = {
  /** 图像铺满屏幕，超出显示视窗的视频部分将被截掉 */
  TRTCVideoFillMode_Fill: 0,
  /** 图像长边填满屏幕，短边区域会被填充黑色 */
  TRTCVideoFillMode_Fit: 1,
};
export enum TRTCVideoFillMode {
  TRTCVideoFillMode_Fill = 0,
  TRTCVideoFillMode_Fit = 1,
}
/**
 * 画面渲染镜像类型<br>
 * TRTC 的画面镜像提供下列设置模式
 * @enum {Number}
 */
const TRTCVideoMirrorType_HACK_JSDOC = {
  /** 只适用于移动端， 本地预览时，前置摄像头镜像，后置摄像头不镜像 */
  TRTCVideoMirrorType_Auto: 0,
  /** 所有画面均镜像 */
  TRTCVideoMirrorType_Enable: 1,
  /** 所有画面均不镜像 */
  TRTCVideoMirrorType_Disable: 2,
};
export enum TRTCVideoMirrorType {
  TRTCVideoMirrorType_Auto = 0,
  TRTCVideoMirrorType_Enable = 1,
  TRTCVideoMirrorType_Disable = 2,
}
/**
 * 美颜（磨皮）算法<br>
 * TRTC SDK 内置了多种不同的磨皮算法，您可以选择最适合您产品定位的方案。
 * @enum {Number}
 */
 const TRTCBeautyStyle_HACK_JSDOC = {
  /** 光滑，适用于美女秀场，效果比较明显。 */
  TRTCBeautyStyleSmooth: 0,
  /** 自然，磨皮算法更多地保留了面部细节，主观感受上会更加自然。 */
  TRTCBeautyStyleNature: 1,
};
export enum TRTCBeautyStyle {
  TRTCBeautyStyleSmooth = 0,
  TRTCBeautyStyleNature = 1,
}

/////////////////////////////////////////////////////////////////////////////////
//
//                    【（二）网络相关枚举值定义】
//
/////////////////////////////////////////////////////////////////////////////////
/**
 * 应用场景<br>
 * TRTC 可用于视频会议和在线直播等多种应用场景，针对不同的应用场景，TRTC SDK 的内部会进行不同的优化配置：
 * - TRTCAppSceneVideoCall    ：视频通话场景，适合[1对1视频通话]、[300人视频会议]、[在线问诊]、[视频聊天]、[远程面试]等。
 * - TRTCAppSceneLIVE         ：视频互动直播，适合[视频低延时直播]、[十万人互动课堂]、[视频直播 PK]、[视频相亲房]、[互动课堂]、[远程培训]、[超大型会议]等。
 * - TRTCAppSceneAudioCall    ：语音通话场景，适合[1对1语音通话]、[300人语音会议]、[语音聊天]、[语音会议]、[在线狼人杀]等。
 * - TRTCAppSceneVoiceChatRoom：语音互动直播，适合：[语音低延时直播]、[语音直播连麦]、[语聊房]、[K 歌房]、[FM 电台]等。
 * @enum {Number}
 */
const TRTCAppScene_HACK_JSDOC = {
  /**
   * 视频通话场景，支持720P、1080P高清画质，单个房间最多支持300人同时在线，最高支持50人同时发言。<br>
   * 适合：[视频低延时直播]、[十万人互动课堂]、[视频直播 PK]、[视频相亲房]、[互动课堂]、[远程培训]、[超大型会议]等。<br>
   * 注意：此场景下，您必须通过 TRTCParams 中的 role 字段指定当前用户的角色。
   */
  TRTCAppSceneVideoCall: 0,
  /**
   * 视频互动直播，支持平滑上下麦，切换过程无需等待，主播延时小于300ms；支持十万级别观众同时播放，播放延时低至1000ms。<br>
   * 在线直播场景，内部编码器和网络协议优化侧重性能和兼容性，性能和清晰度表现更佳。
   */
  TRTCAppSceneLIVE: 1,
  /**
   * 语音通话场景，支持 48kHz，支持双声道。单个房间最多支持300人同时在线，最高支持50人同时发言。<br>
   * 适合：[1对1语音通话]、[300人语音会议]、[语音聊天]、[语音会议]、[在线狼人杀]等。
   */
  TRTCAppSceneAudioCall: 2,
  /**
   * 语音互动直播，支持平滑上下麦，切换过程无需等待，主播延时小于300ms；支持十万级别观众同时播放，播放延时低至1000ms。<br>
   * 适合：[语音低延时直播]、[语音直播连麦]、[语聊房]、[K 歌房]、[FM 电台]等。<br>
   * 注意：此场景下，您必须通过 TRTCParams 中的 role 字段指定当前用户的角色。
   */
  TRTCAppSceneVoiceChatRoom: 3,
};
export enum TRTCAppScene {
  TRTCAppSceneVideoCall = 0,
  TRTCAppSceneLIVE = 1,
  TRTCAppSceneAudioCall = 2,
  TRTCAppSceneVoiceChatRoom = 3,
}
/**
 * 角色，仅适用于直播场景（TRTCAppSceneLIVE 和 TRTCAppSceneVoiceChatRoom）<br>
 * 在直播场景中，多数用户只是观众，只有个别用户是主播，这种角色区分可以有利于 TRTC 进行更好的定向优化。
 * - Anchor：主播，可以上行视频和音频，一个房间里最多支持50个主播同时上行音视频。
 * - Audience：观众，只能观看，不能上行视频和音频，一个房间里的观众人数没有上限。
 * @enum {Number}
 */
const TRTCRoleType_HACK_JSDOC = {
  /** 主播 */
  TRTCRoleAnchor: 20,
  /** 观众 */
  TRTCRoleAudience: 21,
};
export enum TRTCRoleType {
  TRTCRoleAnchor = 20,
  TRTCRoleAudience = 21,
}

/////////////////////////////////////////////////////////////////////////////////
//
//                    【（三）继承 TXLiteAVBase 的定义】
//
/////////////////////////////////////////////////////////////////////////////////
/**
 * 音频质量<br>
 * @enum {Number}
 */
const WebRTCAudioQuality_HACK_JSDOC = {
  /** 标准模式（或者默认模式）：采样率：48k；单声道；音频码率：40kbps；SDK 默认的音频质量 */
  WebRTCAudioQualityStandard: 0,
  /** 高音质模式：采样率：48k；单声道；音频码率：128kbps */
  WebRTCAudioQualityHigh: 1,
  /** 标准立体声模式：采样率：48k；双声道；音频码率：64kbps */
  WebRTCAudioQualityStandardStereo: 2,
  /** 高音质立体声模式：采样率：48k；双声道；音频码率：192kbps */
  WebRTCAudioQualityHighStereo: 3,
};
export enum WebRTCAudioQuality {
  WebRTCAudioQualityStandard = 0,
  WebRTCAudioQualityHigh = 1,
  WebRTCAudioQualityStandardStereo = 2,
  WebRTCAudioQualityHighStereo = 3,
}
/**
 * 设备信息<br>
 * @param {String} deviceId   - 设备PID，字符编码格式是UTF-8
 * @param {String} deviceName - 设备名称，字符编码格式是UTF-8
 * @param {String} kind   - 设备类型，['videoinput' | 'audioinput']
 * @param {String} deviceName - 设备名称，字符编码格式是UTF-8
 */
export class TRTCDeviceInfo {
  public deviceId: string;
  public deviceName: string;
  public kind?: string;
  public label?: string; // 就是 deviceName
  public groupId?: string;
  constructor(deviceId = '', deviceName = '', kind = '', label = '', groupId = '') {
    this.deviceId = deviceId;
    this.deviceName = deviceName;
    this.kind = kind;
    this.label = label;
    this.groupId = groupId;
  }
}
// /**
//  * 视频帧数据<br/>
//  * @param {TRTCVideoPixelFormat} videoFormat   - 视频帧的格式
//  * @param {TRTCVideoBufferType} bufferType - 视频数据结构类型
//  * @param {ArrayBuffer} data - 视频数据，字段 bufferType 是 LiteAVVideoBufferType_Buffer 时生效
//  * @param {Number} textureId - 视频纹理ID，字段bufferType是LiteAVVideoBufferType_Texture时生效
//  * @param {Number} length - 视频数据的长度，单位是字节，对于i420而言， length = width * height * 3 / 2，对于BGRA32而言， length = width * height * 4
//  * @param {Number} width - 画面的宽度
//  * @param {Number} height - 画面的高度
//  * @param {Number} timestamp - 时间戳，单位ms
//  * @param {Number} rotation - 画面旋转角度
//  */
// export class TRTCVideoFrame {
//   public videoFormat: number;
//   public bufferType: number;
//   public data: null | ArrayBuffer;
//   public textureId: number;
//   public length: number;
//   public width: number;
//   public height: number;
//   public timestamp: number;
//   public rotation: number;
//   constructor(
//     videoFormat = TRTCVideoPixelFormat.TRTCVideoPixelFormat_Unknown,
//     bufferType = TRTCVideoBufferType.TRTCVideoBufferType_Unknown,
//     data: null | ArrayBuffer = null,
//     textureId = 0,
//     length = 0,
//     width = 0,
//     height = 0,
//     timestamp = 0,
//     rotation = 0,
//   ) {
//     this.videoFormat = videoFormat;
//     this.bufferType = bufferType;
//     this.data = data;
//     this.textureId = textureId;
//     this.length = length;
//     this.width = width;
//     this.height = height;
//     this.timestamp = timestamp;
//     this.rotation = rotation;
//   }
// }

/////////////////////////////////////////////////////////////////////////////////
//
//                    【（四）更多枚举值定义】
//
/////////////////////////////////////////////////////////////////////////////////
/**
 * 设备操作<br>
 * @enum {Number}
 */
const TRTCDeviceState_HACK_JSDOC = {
  /** 添加设备 */
  TRTCDeviceStateAdd: 0,
  /** 移除设备 */
  TRTCDeviceStateRemove: 1,
  /** 设备已启用 */
  TRTCDeviceStateActive: 2,
};
export enum TRTCDeviceState {
  TRTCDeviceStateAdd = 0,
  TRTCDeviceStateRemove = 1,
  TRTCDeviceStateActive = 2,
}

/**
 * 设备类型<br>
 * @enum {Number}
 */
const TRTCDeviceType_HACK_JSDOC = {
  /** 未知类型 */
  TRTCDeviceTypeUnknow: -1,
  /** 麦克风 */
  TRTCDeviceTypeMic: 0,
  /** 扬声器 */
  TRTCDeviceTypeSpeaker: 1,
  /** 摄像头 */
  TRTCDeviceTypeCamera: 2,
};
export enum TRTCDeviceType {
  TRTCDeviceTypeUnknow = -1,
  TRTCDeviceTypeMic = 0,
  TRTCDeviceTypeSpeaker = 1,
  TRTCDeviceTypeCamera = 2,
}

/////////////////////////////////////////////////////////////////////////////////
//
//                      【（五）TRTC 核心类型定义】
//
/////////////////////////////////////////////////////////////////////////////////
/**
 * 进房相关参数<br>
 * 只有该参数填写正确，才能顺利调用 enterRoom 进入 roomId 所指定的音视频房间。
 * @param {Number}       sdkAppId      - 【字段含义】应用标识（必填），腾讯视频云基于 sdkAppId 完成计费统计。<br>
 *                                       【推荐取值】在腾讯云 [TRTC 控制台](https://console.cloud.tencent.com/rav/) 中创建应用，之后可以在账号信息页面中得到该 ID。<br>
 * @param {String}       userId        - 【字段含义】用户标识（必填）。当前用户的 userId，相当于用户名，UTF-8编码。<br>
 *                                       【推荐取值】如果一个用户在您的账号系统中的 ID 为“abc”，则 userId 即可设置为“abc”。<br>
 * @param {String}       userSig       - 【字段含义】用户签名（必填），当前 userId 对应的验证签名，相当于登录密码。<br>
 *                                       【推荐取值】请参考 [如何计算UserSig](https://cloud.tencent.com/document/product/647/17275)。<br>
 * @param {Number}       roomId        - 【字段含义】房间号码（必填），指定房间号，在同一个房间里的用户（userId）可以彼此看到对方并进行视频通话, roomId 和 strRoomId 必须填一个, 若您选用 strRoomId，则 roomId 需要填写为0。<br>
 *                                       【推荐取值】您可以随意指定，但请不要重复，如果您的用户账号 ID 是数字类型的，可以直接用创建者的用户 ID 作为 roomId。<br>
 * @param {String}       strRoomId     - 【字段含义】字符串房间号码（选填），roomId 和 strRoomId 必须填一个。若两者都填，则优先选择 roomId。<br>
 *                                       【推荐取值】您可以随意指定，但请不要重复。<br>
 * @param {TRTCRoleType} role          - 【字段含义】直播场景下的角色，仅适用于直播场景（TRTCAppSceneLIVE 和 TRTCAppSceneVoiceChatRoom），视频通话场景下指定无效。<br>
 *                                       【推荐取值】默认值：主播（TRTCRoleAnchor）<br>
 * @param {String}       privateMapKey - 【字段含义】房间签名（非必填），如果您希望某个房间只能让特定的某些 userId 进入，就需要使用 privateMapKey 进行权限保护。<br>
 *                                       【推荐取值】仅建议有高级别安全需求的客户使用，参考文档：[进房权限保护](https://cloud.tencent.com/document/product/647/32240)<br>
 * @param {String}       businessInfo  - 【字段含义】业务数据（非必填），某些非常用的高级特性才需要用到此字段。<br>
 *                                       【推荐取值】不建议使用<br>
 * @param {String}       streamId      - 【字段含义】绑定腾讯云直播 CDN 流 ID[非必填]，设置之后，您就可以在腾讯云直播 CDN 上通过标准直播方案（FLV或HLS）播放该用户的音视频流。<br>
 *                                       【推荐取值】限制长度为64字节，可以不填写，一种推荐的方案是使用 “sdkappid_roomid_userid_main” 作为 streamid，这样比较好辨认且不会在您的多个应用中发生冲突。<br>
 *                                       【特殊说明】要使用腾讯云直播 CDN，您需要先在[控制台](https://console.cloud.tencent.com/trtc/) 中的功能配置页开启“启动自动旁路直播”开关。<br>
 *                                       【参考文档】[CDN 旁路直播](https://cloud.tencent.com/document/product/647/16826)。
 * @param {String}       userDefineRecordId - 【字段含义】设置云端录制完成后的回调消息中的 "userdefinerecordid"  字段内容，便于您更方便的识别录制回调。<br>
 *                                            【推荐取值】限制长度为64字节，只允许包含大小写英文字母（a-zA-Z）、数字（0-9）及下划线和连词符。<br>
 *                                            【参考文档】[云端录制](https://cloud.tencent.com/document/product/647/16823)。
 */
export class TRTCParams {
  public sdkAppId: number;
  public userId: string;
  public userSig: string;
  public roomId: number;
  public strRoomId: string;
  public role: number;
  public privateMapKey: null | string;
  // public businessInfo: null | string;
  public streamId: null | string;
  public userDefineRecordId: null | string;
  constructor(
    sdkAppId = 0,
    userId = '',
    userSig = '',
    roomId = 0,
    strRoomId = '',
    role = TRTCRoleType.TRTCRoleAnchor,
    privateMapKey: null | string = null,
    businessInfo: null | string = null,
    streamId: null | string = null,
    userDefineRecordId: null | string = null,
  ) {
    this.sdkAppId = sdkAppId;
    this.userId = userId;
    this.userSig = userSig;
    this.roomId = roomId;
    this.strRoomId = strRoomId;
    this.role = role;
    this.privateMapKey = privateMapKey;
    // this.businessInfo = businessInfo;
    this.streamId = streamId;
    this.userDefineRecordId = userDefineRecordId;
  }
}
/**
 * 视频编码参数<br>
 * 该设置决定了远端用户看到的画面质量（同时也是云端录制出的视频文件的画面质量）。
 * @param {TRTCVideoResolution}     videoResolution - 【字段含义】 视频分辨率<br>
 *                                                    【推荐取值】 <br>
 *                                                     - 视频通话建议选择360 × 640及以下分辨率，resMode 选择 Portrait。<br>
 *                                                     - 手机直播建议选择 540 × 960，resMode 选择 Portrait。<br>
 *                                                     - Window 和 iMac 建议选择 640 × 360 及以上分辨率，resMode 选择 Landscape。
 *                                                    【特别说明】 TRTCVideoResolution 默认只能横屏模式的分辨率，例如640 × 360。<br>
 *                                                                如需使用竖屏分辨率，请指定 resMode 为 Portrait，例如640 × 360结合 Portrait 则为360 × 640。<br>
 * @param {Number}                  videoFps        - 【字段含义】视频采集帧率<br>
 *                                                    【推荐取值】15fps 或 20fps，10fps 以下会有轻微卡顿感，5fps 以下卡顿感明显，20fps 以上的帧率则过于浪费（电影的帧率也只有 24fps）。<br>
 *                                                    【特别说明】很多 Android 手机的前置摄像头并不支持15fps以上的采集帧率，部分过于突出美颜功能的 Android 手机前置摄像头的采集帧率可能低于10fps。<br>
 * @param {Number}                  videoBitrate    - 【字段含义】视频上行码率<br>
 *                                                    【推荐取值】推荐设置请参考本文件前半部分 TRTCVideoResolution 定义处的注释说明<br>
 *                                                    【特别说明】码率太低会导致视频中有很多的马赛克<br>
 */
export class TRTCVideoEncParam {
  public videoResolution: TRTCVideoResolution;
  // public resMode: TRTCVideoResolutionMode;
  public videoFps: number;
  public videoBitrate: number;
  // public minVideoBitrate: number;
  // public enableAdjustRes: boolean;
  constructor(
    videoResolution: TRTCVideoResolution = TRTCVideoResolution.TRTCVideoResolution_640_360,
    // resMode = TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape,
    videoFps: number = 15,
    videoBitrate: number = 550,
    // minVideoBitrate = 0,
    // enableAdjustRes = false,
  ) {
    this.videoResolution = videoResolution;
    // this.resMode = resMode;
    this.videoFps = videoFps;
    this.videoBitrate = videoBitrate;
    // this.minVideoBitrate = minVideoBitrate;
    // this.enableAdjustRes = enableAdjustRes;
  }
}
/**
 * 视频画面旋转方向<br>
 * TRTC SDK 提供了对本地和远程画面的旋转角度设置 API，如下的旋转角度都是指顺时针方向的。
 * @enum {Number}
 */
 const TRTCVideoRotation_HACK_JSDOC = {
  /** 顺时针旋转0度 */
  TRTCVideoRotation_0: 0,
  /** 顺时针旋转90度 */
  TRTCVideoRotation_90: 1,
  /** 顺时针旋转180度 */
  TRTCVideoRotation_180: 2,
  /** 顺时针旋转270度 */
  TRTCVideoRotation_270: 3,
};
export enum TRTCVideoRotation {
  TRTCVideoRotation_0 = 0,
  TRTCVideoRotation_90 = 1,
  TRTCVideoRotation_180 = 2,
  TRTCVideoRotation_270 = 3,
}
/**
 * 画面渲染参数<br>
 * 您可以通过设置此参数来控制画面的旋转、填充、镜像模式
 * @param {TRTCVideoRotation} rotation  - 【字段含义】视频画面旋转方向
 * @param {TRTCVideoFillMode} fillMode  - 【字段含义】视频画面填充模式
 * @param {TRTCVideoMirrorType} mirrorType  - 【字段含义】画面渲染镜像类型
 */
export class TRTCRenderParams {
  public rotation: TRTCVideoRotation;
  public fillMode: TRTCVideoFillMode;
  public mirrorType: TRTCVideoMirrorType;
  constructor(rotation = TRTCVideoRotation.TRTCVideoRotation_0, fillMode = TRTCVideoFillMode.TRTCVideoFillMode_Fit, mirrorType = TRTCVideoMirrorType.TRTCVideoMirrorType_Disable) {
    this.rotation = rotation;
    this.fillMode = fillMode;
    this.mirrorType = mirrorType;
  }
}
/**
 * 网络质量<br>
 * @enum {Number}
 */
 const TRTCNetQuality_HACK_JSDOC = {
  /** 网络状况未知，表示当前 client 实例还没有建立上行/下行连接 */
  TRTCNetQuality_Unknown: 0,
  /** 网络状况极佳 */
  TRTCNetQuality_Excellent: 1,
  /** 网络状况较好 */
  TRTCNetQuality_Good: 2,
  /** 网络状况一般 */
  TRTCNetQuality_Poor: 3,
  /** 网络状况差 */
  TRTCNetQuality_Bad: 4,
  /** 网络状况极差 */
  TRTCNetQuality_Vbad: 5,
  /** 网络连接已断开，注意：若下行网络质量为此值，则表示所有下行连接都断开了 */
  TRTCNetQuality_Down: 6,
};
export enum TRTCNetQuality {
  TRTCNetQuality_Unknown = 0,
  TRTCNetQuality_Excellent = 1,
  TRTCNetQuality_Good = 2,
  TRTCNetQuality_Poor = 3,
  TRTCNetQuality_Bad = 4,
  TRTCNetQuality_Vbad = 5,
  TRTCNetQuality_Down = 6
}
/**
 * 网络质量<br>
 * 表示视频质量的好坏，通过这个数值，您可以在 UI 界面上用图标表征 userId 的通话线路质量
 * @param {String}      userId  - 用户标识
 * @param {TRTCQuality} quality - 视频质量
 */
export class TRTCNetQualityInfo {
  public userId: string;
  public quality: TRTCNetQuality;
  public uplinkNetworkQuality: TRTCNetQuality;
  public uplinkRTT: number;
  public uplinkLoss: number;
  public downlinkRTT: number;
  public downlinkLoss: number;
  constructor(userId = '', quality = TRTCNetQuality.TRTCNetQuality_Unknown, uplinkNetworkQuality: TRTCNetQuality, uplinkRTT: number, uplinkLoss: number, downlinkRTT: number, downlinkLoss: number) {
    this.userId = userId;
    this.quality = quality;
    this.uplinkNetworkQuality = uplinkNetworkQuality;
    this.uplinkRTT = uplinkRTT;
    this.uplinkLoss = uplinkLoss;
    this.downlinkRTT = downlinkRTT;
    this.downlinkLoss = downlinkLoss;
  }
}
/**
 * 音量大小<br>
 * 表示语音音量的评估大小，通过这个数值，您可以在 UI 界面上用图标表征 userId 是否有在说话。
 * @param {String} userId - 说话者的 userId，字符编码格式是 UTF-8
 * @param {Number} volume - 说话者的音量， 取值范围0 - 100
 */
export class TRTCVolumeInfo {
  public userId: string;
  public volume: number;
  constructor(userId: string = '', volume: number = 0) {
    this.userId = userId;
    this.volume = volume;
  }
}
/**
 * CDN 旁路推流参数<br>
 * @param {Number} appId - 腾讯云 AppID，请在 [实时音视频控制台](https://console.cloud.tencent.com/rav) 选择已经创建的应用，单击【帐号信息】后，在“直播信息”中获取
 * @param {Number} bizId - 腾讯云直播 bizId，请在 [实时音视频控制台](https://console.cloud.tencent.com/rav) 选择已经创建的应用，单击【帐号信息】后，在“直播信息”中获取
 * @param {String} url - 旁路转推的 URL
 */
export class TRTCPublishCDNParam {
  public appId: number;
  public bizId: number;
  public url: null | string;
  constructor(appId: number = 0, bizId: number = 0, url: null | string = null) {
    this.appId = appId;
    this.bizId = bizId;
    this.url = url;
  }
}
/**
 * 本地的音视频统计信息<br>
 * @param {Number} width           - 视频宽度
 * @param {Number} height          - 视频高度
 * @param {Number} frameRate       - 帧率（fps）
 * @param {Number} videoBitrate    - 视频发送码率（Kbps）
 * @param {Number} audioSampleRate - 音频采样率（Hz）
 * @param {Number} audioBitrate    - 音频发送码率（Kbps）
 * @param {TRTCVideoStreamType} streamType - 流类型（大画面 | 小画面 | 辅路画面）
 */
export class TRTCLocalStatistics {
  public width: number;
  public height: number;
  public frameRate: number;
  public videoBitrate: number;
  public audioSampleRate: number;
  public audioBitrate: number;
  public streamType: TRTCVideoStreamType;
  constructor(width = 0, height = 0, frameRate = 0, videoBitrate = 0, audioSampleRate = 0, audioBitrate = 0, streamType = TRTCVideoStreamType.TRTCVideoStreamTypeBig) {
    this.width = width;
    this.height = height;
    this.frameRate = frameRate;
    this.videoBitrate = videoBitrate;
    this.audioSampleRate = audioSampleRate;
    this.audioBitrate = audioBitrate;
    this.streamType = streamType;
  }
}
/**
 * 统计数据<br>
 * @param {Number} upLoss    - C -> S 上行丢包率（％），这个值越小越好，例如，0%的丢包率代表网络很好，
 *                             而 30% 的丢包率则意味着 SDK 向服务器发送的每10个数据包中就会有3个会在上行传输中丢失。
 * @param {Number} downLoss  - S -> C 下行丢包率（％），这个值越小越好，例如，0%的丢包率代表网络很好，
 *                             而 30% 的丢包率则意味着服务器向 SDK 发送的每10个数据包中就会有3个会在下行传输中丢失。
 * @param {Number} appCpu    - 当前 App 的 CPU 使用率（％）
 * @param {Number} systemCpu - 当前系统的 CPU 使用率（％）
 * @param {Number} rtt       - 延迟（毫秒），代表 SDK 跟服务器一来一回之间所消耗的时间，这个值越小越好。
 *                             一般低于50ms的 rtt 是比较理想的情况，而高于100ms的 rtt 会引入较大的通话延时。
 *                             由于数据上下行共享一条网络连接，所以 local 和 remote 的 rtt 相同。
 * @param {Number} receivedBytes - 总接收字节数（包含信令和音视频）
 * @param {Number} sentBytes     - 总发送字节总数（包含信令和音视频）
 * @param {TRTCLocalStatistics[]} localStatisticsArray - 自己本地的音视频统计信息，由于可能有大画面、小画面以及辅路画面等多路的情况，所以是一个数组
 * @param {Number} localStatisticsArraySize - 数组 localStatisticsArray 的大小
 * @param {TRTCRemoteStatistics[]} remoteStatisticsArray - 远端成员的音视频统计信息，由于可能有大画面、小画面以及辅路画面等多路的情况，所以是一个数组
 * @param {Number} remoteStatisticsArraySize - 数组 remoteStatisticsArray 的大小
 */
export class TRTCStatistics {
  public upLoss: number;
  public downLoss: number;
  public appCpu: number;
  public systemCpu: number;
  public rtt: number;
  public receivedBytes: number;
  public sentBytes: number;
  public localStatisticsArray: TRTCLocalStatistics[];
  public localStatisticsArraySize: number;
  // public remoteStatisticsArray: TRTCRemoteStatistics[];
  public remoteStatisticsArraySize: number;
  constructor(
    upLoss = 0,
    downLoss = 0,
    appCpu = 0,
    systemCpu = 0,
    rtt = 0,
    receivedBytes = 0,
    sentBytes = 0,
    localStatisticsArray: TRTCLocalStatistics[] = [],
    localStatisticsArraySize = 0,
    // remoteStatisticsArray: TRTCRemoteStatistics[] = [],
    remoteStatisticsArraySize = 0,
  ) {
    this.upLoss = upLoss;
    this.downLoss = downLoss;
    this.appCpu = appCpu;
    this.systemCpu = systemCpu;
    this.rtt = rtt;
    this.receivedBytes = receivedBytes;
    this.sentBytes = sentBytes;
    this.localStatisticsArray = localStatisticsArray;
    this.localStatisticsArraySize = localStatisticsArraySize;
    // this.remoteStatisticsArray = remoteStatisticsArray;
    this.remoteStatisticsArraySize = remoteStatisticsArraySize;
  }
}

// ------------------------------------------------------------------------------
// 下面是 Electron 用的类型，因为 TUIRoom 中要统一，因此对外暴露。但是并不会放到 API 文档中
// ------------------------------------------------------------------------------
/**
 * 音频质量<br>
 * @enum {Number}
 */
export enum TRTCAudioQuality {
  TRTCAudioQualitySpeech = 1,
  TRTCAudioQualityDefault = 2,
  TRTCAudioQualityMusic = 3,
}
/**
 * 画质偏好<br>
 * 指当 TRTC SDK 在遇到弱网络环境时，您是希望“保清晰”还是“保流畅”：<br>
 * - Smooth：弱网下保流畅，在遭遇弱网环境时首先确保声音的流畅和优先发送，画面会变得模糊且会有较多马赛克，但可以保持流畅不卡顿。
 * - Clear：弱网下保清晰，在遭遇弱网环境时，画面会尽可能保持清晰，但可能会更容易出现卡顿。
 * @enum {Number}
 */
export enum TRTCVideoQosPreference {
  TRTCVideoQosPreferenceSmooth = 1,
  TRTCVideoQosPreferenceClear = 2,
}
/**
 * 流控模式<br>
 * TRTC SDK 内部需要时刻根据网络情况调整内部的编解码器和网络模块，以便能够对网络的变化做出反应。<br>
 * 为了支持快速算法升级，SDK 内部设置了两种不同的流控模式：
 * - ModeClient： 本地控制，用于 SDK 开发内部调试，客户请勿使用。
 * - ModeServer： 云端控制，推荐模式，也是默认默认。
 * > 推荐您使用云端控制，这样每当我们升级 Qos 算法时，您无需升级 SDK 即可体验更好的效果。
 * @enum {Number}
 */
export enum TRTCQosControlMode {
  TRTCQosControlModeClient = 0,
  TRTCQosControlModeServer = 1,
}
/**
 * 网络流控相关参数<br>
 * 网络流控相关参数，该设置决定了SDK在各种网络环境下的调控方向（比如弱网下是“保清晰”还是“保流畅”）
 * @param {TRTCVideoQosPreference} preference  - 【字段含义】弱网下是“保清晰”还是“保流畅”<br>
 *                                               【特别说明】<br>
 *                                                - 弱网下保流畅：在遭遇弱网环境时，画面会变得模糊，且会有较多马赛克，但可以保持流畅不卡顿
 *                                                - 弱网下保清晰：在遭遇弱网环境时，画面会尽可能保持清晰，但可能会更容易出现卡顿
 * @param {TRTCQosControlMode}     controlMode - 【字段含义】流控模式（云端控制 - 客户端控制）<br>
 *                                               【推荐取值】云端控制<br>
 *                                               【特别说明】<br>
 *                                                - Client 模式：客户端控制模式，用于 SDK 开发内部调试，客户请勿使用
 *                                                - Server 模式（默认）：云端控制模式，若没有特殊原因，请直接使用该模式
 *
 */
 export class TRTCNetworkQosParam {
  public preference: TRTCVideoQosPreference;
  public controlMode: TRTCQosControlMode;
  constructor(preference = TRTCVideoQosPreference.TRTCVideoQosPreferenceClear, controlMode = TRTCQosControlMode.TRTCQosControlModeServer) {
    this.preference = preference;
    this.controlMode = controlMode;
  }
 }
 /**
 * 图缓存<br>
 * @param {ArrayBuffer} buffer - 图内容
 * @param {Number}      length - 图缓存大小
 * @param {Number}      width  - 图宽
 * @param {Number}      heigth - 图高
 */
export class TRTCImageBuffer {
  public buffer: ArrayBuffer;
  public length: number;
  public width: number;
  public height: number;
  constructor(buffer = new ArrayBuffer(0), length = 0, width = 0, height = 0) {
    this.buffer = buffer;
    this.length = length;
    this.width = width;
    this.height = height;
  }
}
/**
 * 屏幕分享目标信息<br>
 * @enum {Number}
 */
export enum TRTCScreenCaptureSourceType {
  TRTCScreenCaptureSourceTypeUnknown = -1,
  TRTCScreenCaptureSourceTypeWindow = 0,
  TRTCScreenCaptureSourceTypeScreen = 1,
  TRTCScreenCaptureSourceTypeCustom = 2,
}
 /**
 * 屏幕采集源信息<br>
 * @param {TRTCScreenCaptureSourceType} type       - 采集源类型
 * @param {String}                      sourceId   - 采集源ID；对于窗口，该字段指示窗口句柄；对于屏幕，该字段指示屏幕ID
 * @param {String}                      sourceName - 采集源名称，UTF8编码
 * @param {TRTCImageBuffer}             thumbBGRA  - 缩略图内容
 * @param {TRTCImageBuffer}             iconBGRA   - 图标内容
 * @param {Boolean}                     isMinimizeWindow - 是否最小化窗口
 */
export class TRTCScreenCaptureSourceInfo {
  public type: number;
  public sourceId: string;
  public sourceName: string;
  public thumbBGRA: TRTCImageBuffer;
  public iconBGRA: TRTCImageBuffer;
  public isMinimizeWindow: boolean;
  constructor(
    type = TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeUnknown,
    sourceId = '',
    sourceName = '',
    thumbBGRA = new TRTCImageBuffer(),
    iconBGRA = new TRTCImageBuffer(),
    isMinimizeWindow = false,
  ) {
    this.type = type;
    this.sourceId = sourceId;
    this.sourceName = sourceName;
    this.thumbBGRA = thumbBGRA;
    this.iconBGRA = iconBGRA;
    this.isMinimizeWindow = isMinimizeWindow;
  }
}
/**
 * 记录矩形的四个点坐标<br>
 * @param {Number} left   - 左坐标
 * @param {Number} top    - 上坐标
 * @param {Number} right  - 右坐标
 * @param {Number} bottom - 下坐标
 */
export class Rect {
  public left: number;
  public top: number;
  public right: number;
  public bottom: number;
  constructor(left = 0, top = 0, right = 0, bottom = 0) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }
}
