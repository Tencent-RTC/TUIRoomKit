/* tslint:disable */
/* eslint-disable */
/**
 * TRTC 关键类型定义
 *
 * @description 分辨率、质量等级等枚举和常量值的定义
 *
 */

/////////////////////////////////////////////////////////////////////////////////
//
//                    【（一）视频相关枚举值定义】
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 1.1 视频分辨率
 *
 * 此处仅定义了横屏分辨率，如果要使用360 × 640这样的竖屏分辨率，需要同时指定 TRTCVideoResolutionMode 为 Portrait。
 *
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
 * 1.2 视频分辨率模式
 *
 * - 横屏分辨率：TRTCVideoResolution_640_360 + TRTCVideoResolutionModeLandscape = 640 × 360
 * - 竖屏分辨率：TRTCVideoResolution_640_360 + TRTCVideoResolutionModePortrait  = 360 × 640
 *
 * @enum {Number}
 */
const TRTCVideoResolutionMode_HACK_JSDOC = {
  /** 横屏分辨率 */
  TRTCVideoResolutionModeLandscape: 0,
  /** 竖屏分辨率 */
  TRTCVideoResolutionModePortrait: 1,
};

export enum TRTCVideoResolutionMode {
  TRTCVideoResolutionModeLandscape = 0,
  TRTCVideoResolutionModePortrait = 1,
}

/**
 * 1.3 视频流类型
 *
 * TRTC 内部有三种不同的音视频流，分别是：
 * - 主画面：最常用的一条线路，一般用来传输摄像头的视频数据。
 * - 小画面：跟主画面的内容相同，但是分辨率和码率更低。
 * - 辅流画面：一般用于屏幕分享，以及远程播片（比如老师放一段视频给学生）。
 *
 * 注意:
 * - 如果主播的上行网络和性能比较好，则可以同时送出大小两路画面。
 * - SDK 不支持单独开启小画面，小画面必须依附于主画面而存在。
 *
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
 * 1.4 画质级别
 *
 * TRTC SDK 对画质定义了六种不同的级别，Excellent 代表最好，Down 代表不可用。
 *
 * @enum {Number}
 */
const TRTCQuality_HACK_JSDOC = {
  /** 未定义 */
  TRTCQuality_Unknown: 0,
  /** 最好 */
  TRTCQuality_Excellent: 1,
  /** 好 */
  TRTCQuality_Good: 2,
  /** 一般 */
  TRTCQuality_Poor: 3,
  /** 差 */
  TRTCQuality_Bad: 4,
  /** 很差 */
  TRTCQuality_Vbad: 5,
  /** 不可用 */
  TRTCQuality_Down: 6,
};

export enum TRTCQuality {
  TRTCQuality_Unknown = 0,
  TRTCQuality_Excellent = 1,
  TRTCQuality_Good = 2,
  TRTCQuality_Poor = 3,
  TRTCQuality_Bad = 4,
  TRTCQuality_Vbad = 5,
  TRTCQuality_Down = 6,
}

/**
 * 1.5 视频画面填充模式
 *
 * 如果画面的显示分辨率不等于画面的原始分辨率，就需要您设置画面的填充模式:
 * - TRTCVideoFillMode_Fill，图像铺满屏幕，超出显示视窗的视频部分将被截掉，所以画面显示可能不完整。
 * - TRTCVideoFillMode_Fit，图像长边填满屏幕，短边区域会被填充黑色，但画面的内容肯定是完整的。
 *
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
 * 1.6 视频画面旋转方向
 *
 * TRTC SDK 提供了对本地和远程画面的旋转角度设置 API，如下的旋转角度都是指顺时针方向的。
 *
 * @enum {Number}
 */
const TRTCVideoRotation_HACK_JSDOC = {
  /** 顺时针旋转0度 */
  TRTCVideoRotation0: 0,
  /** 顺时针旋转90度 */
  TRTCVideoRotation90: 1,
  /** 顺时针旋转180度 */
  TRTCVideoRotation180: 2,
  /** 顺时针旋转270度 */
  TRTCVideoRotation270: 3,
};

export enum TRTCVideoRotation {
  TRTCVideoRotation0 = 0,
  TRTCVideoRotation90 = 1,
  TRTCVideoRotation180 = 2,
  TRTCVideoRotation270 = 3,
}

/**
 * 1.7 美颜（磨皮）算法
 *
 * TRTC SDK 内置了多种不同的磨皮算法，您可以选择最适合您产品定位的方案。
 *
 * @enum {Number}
 *
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

/**
 * 1.8 视频像素格式
 *
 * TRTC SDK 提供针对视频的自定义采集和自定义渲染功能，在自定义采集功能中，您可以用如下枚举值描述您采集的视频像素格式。
 * 在自定义渲染功能中，您可以指定您期望 SDK 回调的视频像素格式。
 *
 * @enum {Number}
 *
 */
const TRTCVideoPixelFormat_HACK_JSDOC = {
  /** 未定义 */
  TRTCVideoPixelFormat_Unknown: 0,
  /** I420 */
  TRTCVideoPixelFormat_I420: 1,
  /** OpenGL 2D 纹理 */
  // TRTCVideoPixelFormat_Texture_2D: 2,
  /** BGRA32 */
  TRTCVideoPixelFormat_BGRA32: 3,
};

export enum TRTCVideoPixelFormat {
  TRTCVideoPixelFormat_Unknown = 0,
  TRTCVideoPixelFormat_I420 = 1,
  // TRTCVideoPixelFormat_Texture_2D= 2,
  TRTCVideoPixelFormat_BGRA32 = 3,
}

/**
 * 1.9 视频数据包装格式
 *
 * @enum {Number}
 *
 */
const TRTCVideoBufferType_HACK_JSDOC = {
  /** 未知类型 */
  TRTCVideoBufferType_Unknown: 0,
  /** 二进制Buffer类型 */
  TRTCVideoBufferType_Buffer: 1,
  /** 纹理类型 */
  // TRTCVideoBufferType_Texture: 3,
};

export enum TRTCVideoBufferType {
  TRTCVideoBufferType_Unknown = 0,
  TRTCVideoBufferType_Buffer = 1,
  // TRTCVideoBufferType_Texture= 3,
}

/**
 * 1.10 画面渲染镜像类型
 *
 * TRTC 的画面镜像提供下列设置模式
 *
 * @enum {Number}
 *
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

/////////////////////////////////////////////////////////////////////////////////
//
//                    【（二）网络相关枚举值定义】
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 2.1 应用场景
 *
 * TRTC 可用于视频会议和在线直播等多种应用场景，针对不同的应用场景，TRTC SDK 的内部会进行不同的优化配置：
 * - TRTCAppSceneVideoCall    ：视频通话场景，适合[1对1视频通话]、[300人视频会议]、[在线问诊]、[视频聊天]、[远程面试]等。
 * - TRTCAppSceneLIVE         ：视频互动直播，适合[视频低延时直播]、[十万人互动课堂]、[视频直播 PK]、[视频相亲房]、[互动课堂]、[远程培训]、[超大型会议]等。
 * - TRTCAppSceneAudioCall    ：语音通话场景，适合[1对1语音通话]、[300人语音会议]、[语音聊天]、[语音会议]、[在线狼人杀]等。
 * - TRTCAppSceneVoiceChatRoom：语音互动直播，适合：[语音低延时直播]、[语音直播连麦]、[语聊房]、[K 歌房]、[FM 电台]等。
 *
 * @enum {Number}
 *
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
 * 2.2 角色，仅适用于直播场景（TRTCAppSceneLIVE 和 TRTCAppSceneVoiceChatRoom）
 *
 * 在直播场景中，多数用户只是观众，只有个别用户是主播，这种角色区分可以有利于 TRTC 进行更好的定向优化。
 *
 * - Anchor：主播，可以上行视频和音频，一个房间里最多支持50个主播同时上行音视频。
 * - Audience：观众，只能观看，不能上行视频和音频，一个房间里的观众人数没有上限。
 *
 * @enum {Number}
 *
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

/**
 * 2.3 流控模式
 *
 * TRTC SDK 内部需要时刻根据网络情况调整内部的编解码器和网络模块，以便能够对网络的变化做出反应。
 * 为了支持快速算法升级，SDK 内部设置了两种不同的流控模式：
 * - ModeClient： 本地控制，用于 SDK 开发内部调试，客户请勿使用。
 * - ModeServer： 云端控制，推荐模式，也是默认默认。
 *
 * > 推荐您使用云端控制，这样每当我们升级 Qos 算法时，您无需升级 SDK 即可体验更好的效果。
 *
 * @enum {Number}
 *
 */
const TRTCQosControlMode_HACK_JSDOC = {
  /** 客户端控制（用于 SDK 开发内部调试，客户请勿使用） */
  TRTCQosControlModeClient: 0,
  /** 云端控制（默认） */
  TRTCQosControlModeServer: 1,
};

export enum TRTCQosControlMode {
  TRTCQosControlModeClient = 0,
  TRTCQosControlModeServer = 1,
}

/**
 * 2.4 画质偏好
 *
 * 指当 TRTC SDK 在遇到弱网络环境时，您是希望“保清晰”还是“保流畅”：
 *
 * - Smooth：弱网下保流畅，在遭遇弱网环境时首先确保声音的流畅和优先发送，画面会变得模糊且会有较多马赛克，但可以保持流畅不卡顿。
 * - Clear：弱网下保清晰，在遭遇弱网环境时，画面会尽可能保持清晰，但可能会更容易出现卡顿。
 *
 * @enum {Number}
 *
 */
const TRTCVideoQosPreference_HACK_JSDOC = {
  /** 弱网下保流畅 */
  TRTCVideoQosPreferenceSmooth: 1,
  /** 弱网下保清晰 */
  TRTCVideoQosPreferenceClear: 2,
};

export enum TRTCVideoQosPreference {
  TRTCVideoQosPreferenceSmooth = 1,
  TRTCVideoQosPreferenceClear = 2,
}

/////////////////////////////////////////////////////////////////////////////////
//
//                    【（三）继承 TXLiteAVBase 的定义】
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 3.1 音频帧的格式
 *
 * @enum {Number}
 *
 */
const TRTCAudioFrameFormat_HACK_JSDOC = {
  /** 未指定 */
  TRTCAudioFrameFormatNone: 0,
  /** PCM，每个采样点占16bit数据量。 */
  TRTCAudioFrameFormatPCM: 1,
};

export enum TRTCAudioFrameFormat {
  TRTCAudioFrameFormatNone = 0,
  TRTCAudioFrameFormatPCM = 1,
}

/**
 * 3.2 屏幕分享目标信息
 *
 * @enum {Number}
 *
 */
const TRTCScreenCaptureSourceType_HACK_JSDOC = {
  /** 未知类型 */
  TRTCScreenCaptureSourceTypeUnknown: -1,
  /** 该分享目标是某一个 Windows 或 Mac 窗口 */
  TRTCScreenCaptureSourceTypeWindow: 0,
  /** 该分享目标是整个 Windows 桌面或 Mac 桌面 */
  TRTCScreenCaptureSourceTypeScreen: 1,
  /** 该分享目标是自定义窗口（保留字段，暂无用法） */
  TRTCScreenCaptureSourceTypeCustom: 2,
};

export enum TRTCScreenCaptureSourceType {
  TRTCScreenCaptureSourceTypeUnknown = -1,
  TRTCScreenCaptureSourceTypeWindow = 0,
  TRTCScreenCaptureSourceTypeScreen = 1,
  TRTCScreenCaptureSourceTypeCustom = 2,
}

/**
 * 3.3 音频质量
 *
 * @enum {Number}
 *
 */
const TRTCAudioQuality_HACK_JSDOC = {
  /** 语音模式：采样率：16k；单声道；音频裸码率：16kbps；适合语音通话为主的场景，比如在线会议，语音通话。 */
  TRTCAudioQualitySpeech: 1,
  /** 标准模式（或者默认模式）：采样率：48k；单声道；音频裸码率：50kbps；SDK 默认的音频质量，如无特殊需求推荐选择之。 */
  TRTCAudioQualityDefault: 2,
  /** 音乐模式：采样率：48k；双声道 + 全频带；音频裸码率：128kbps；适合需要高保真传输音乐的场景，比如K歌、音乐直播等。 */
  TRTCAudioQualityMusic: 3,
};

export enum TRTCAudioQuality {
  TRTCAudioQualitySpeech = 1,
  TRTCAudioQualityDefault = 2,
  TRTCAudioQualityMusic = 3,
}

/**
 * 3.4 图缓存
 *
 * @param {ArrayBuffer} buffer - 图内容
 * @param {Number}      length - 图缓存大小
 * @param {Number}      width  - 图宽
 * @param {Number}      heigth - 图高
 *
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
 * 3.5 屏幕采集源信息
 *
 * @param {TRTCScreenCaptureSourceType} type       - 采集源类型
 * @param {String}                      sourceId   - 采集源ID；对于窗口，该字段指示窗口句柄；对于屏幕，该字段指示屏幕ID
 * @param {String}                      sourceName - 采集源名称，UTF8编码
 * @param {TRTCImageBuffer}             thumbBGRA  - 缩略图内容
 * @param {TRTCImageBuffer}             iconBGRA   - 图标内容
 * @param {Boolean}                     isMinimizeWindow - 是否最小化窗口
 *
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
 * 3.6 设备信息
 *
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

/**
 * 3.7 视频帧数据
 *
 * @param {TRTCVideoPixelFormat} videoFormat   - 视频帧的格式
 * @param {TRTCVideoBufferType} bufferType - 视频数据结构类型
 * @param {ArrayBuffer} data - 视频数据，字段 bufferType 是 LiteAVVideoBufferType_Buffer 时生效
 * @param {Number} textureId - 视频纹理ID，字段bufferType是LiteAVVideoBufferType_Texture时生效
 * @param {Number} length - 视频数据的长度，单位是字节，对于i420而言， length = width * height * 3 / 2，对于BGRA32而言， length = width * height * 4
 * @param {Number} width - 画面的宽度
 * @param {Number} height - 画面的高度
 * @param {Number} timestamp - 时间戳，单位ms
 * @param {Number} rotation - 画面旋转角度
 *
 */
export class TRTCVideoFrame {
  public videoFormat: number;
  public bufferType: number;
  public data: null | ArrayBuffer;
  public textureId: number;
  public length: number;
  public width: number;
  public height: number;
  public timestamp: number;
  public rotation: number;
  constructor(
    videoFormat = TRTCVideoPixelFormat.TRTCVideoPixelFormat_Unknown,
    bufferType = TRTCVideoBufferType.TRTCVideoBufferType_Unknown,
    data: null | ArrayBuffer = null,
    textureId = 0,
    length = 0,
    width = 0,
    height = 0,
    timestamp = 0,
    rotation = 0,
  ) {
    this.videoFormat = videoFormat;
    this.bufferType = bufferType;
    this.data = data;
    this.textureId = textureId;
    this.length = length;
    this.width = width;
    this.height = height;
    this.timestamp = timestamp;
    this.rotation = rotation;
  }
}

/////////////////////////////////////////////////////////////////////////////////
//
//                    【（四）更多枚举值定义】
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 4.1 Log 级别
 *
 * @enum {Number}
 *
 */
const TRTCLogLevel_HACK_JSDOC = {
  /** 不输出任何 SDK Log */
  TRTCLogLevelNone: 0,
  /** 输出所有级别的 Log */
  TRTCLogLevelVerbose: 1,
  /** 输出 DEBUG，INFO，WARNING，ERROR 和 FATAL 级别的 Log */
  TRTCLogLevelDebug: 2,
  /** 输出 INFO，WARNNING，ERROR 和 FATAL 级别的 Log */
  TRTCLogLevelInfo: 3,
  /** 只输出WARNNING，ERROR 和 FATAL 级别的 Log */
  TRTCLogLevelWarn: 4,
  /** 只输出ERROR 和 FATAL 级别的 Log */
  TRTCLogLevelError: 5,
  /** 只输出 FATAL 级别的 Log */
  TRTCLogLevelFatal: 6,
};

export enum TRTCLogLevel {
  TRTCLogLevelNone = 0,
  TRTCLogLevelVerbose = 1,
  TRTCLogLevelDebug = 2,
  TRTCLogLevelInfo = 3,
  TRTCLogLevelWarn = 4,
  TRTCLogLevelError = 5,
  TRTCLogLevelFatal = 6,
}

/**
 * 4.2 设备操作
 *
 * @enum {Number}
 *
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
 * 4.3 设备类型
 *
 * @enum {Number}
 *
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

/**
 * 4.4 水印图片的源类型
 *
 * @enum {Number}
 *
 */
const TRTCWaterMarkSrcType_HACK_JSDOC = {
  /** 图片文件路径，支持 BMP、GIF、JPEG、PNG、TIFF、Exif、WMF 和 EMF 文件格式 */
  TRTCWaterMarkSrcTypeFile: 0,
  /** BGRA32格式内存块 */
  TRTCWaterMarkSrcTypeBGRA32: 1,
  /** RGBA32格式内存块 */
  TRTCWaterMarkSrcTypeRGBA32: 2,
};

export enum TRTCWaterMarkSrcType {
  TRTCWaterMarkSrcTypeFile = 0,
  TRTCWaterMarkSrcTypeBGRA32 = 1,
  TRTCWaterMarkSrcTypeRGBA32 = 2,
}

/////////////////////////////////////////////////////////////////////////////////
//
//                      【（五）TRTC 核心类型定义】
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 5.1 进房相关参数
 *
 * 只有该参数填写正确，才能顺利调用 enterRoom 进入 roomId 所指定的音视频房间。
 *
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
  public businessInfo: null | string;
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
    this.businessInfo = businessInfo;
    this.streamId = streamId;
    this.userDefineRecordId = userDefineRecordId;
  }
}

/**
 * 5.2 视频编码参数
 *
 * 该设置决定了远端用户看到的画面质量（同时也是云端录制出的视频文件的画面质量）。
 *
 * @param {TRTCVideoResolution}     videoResolution - 【字段含义】 视频分辨率<br>
 *                                                    【推荐取值】 <br>
 *                                                     - 视频通话建议选择360 × 640及以下分辨率，resMode 选择 Portrait。<br>
 *                                                     - 手机直播建议选择 540 × 960，resMode 选择 Portrait。<br>
 *                                                     - Window 和 iMac 建议选择 640 × 360 及以上分辨率，resMode 选择 Landscape。
 *                                                    【特别说明】 TRTCVideoResolution 默认只能横屏模式的分辨率，例如640 × 360。<br>
 *                                                                如需使用竖屏分辨率，请指定 resMode 为 Portrait，例如640 × 360结合 Portrait 则为360 × 640。<br>
 * @param {TRTCVideoResolutionMode} resMode         - 【字段含义】分辨率模式（横屏分辨率 - 竖屏分辨率）<br>
 *                                                    【推荐取值】手机直播建议选择 Portrait，Window 和 Mac 建议选择 Landscape。<br>
 *                                                    【特别说明】如果 videoResolution 指定分辨率 640 × 360，resMode 指定模式为 Portrait，则最终编码出的分辨率为360 × 640。<br>
 * @param {Number}                  videoFps        - 【字段含义】视频采集帧率<br>
 *                                                    【推荐取值】15fps 或 20fps，10fps 以下会有轻微卡顿感，5fps 以下卡顿感明显，20fps 以上的帧率则过于浪费（电影的帧率也只有 24fps）。<br>
 *                                                    【特别说明】很多 Android 手机的前置摄像头并不支持15fps以上的采集帧率，部分过于突出美颜功能的 Android 手机前置摄像头的采集帧率可能低于10fps。<br>
 * @param {Number}                  videoBitrate    - 【字段含义】视频上行码率<br>
 *                                                    【推荐取值】推荐设置请参考本文件前半部分 TRTCVideoResolution 定义处的注释说明<br>
 *                                                    【特别说明】码率太低会导致视频中有很多的马赛克<br>
 * @param {Number}                  minVideoBitrate  -【字段含义】最低视频码率，SDK 会在网络不佳的情况下主动降低视频码率，最低会降至 minVideoBitrate 所设定的数值。
 *                                                    【推荐取值】<br>
 *                                                      - 如果您追求“允许卡顿但要保持清晰”的效果，可以设置 minVideoBitrate 为 videoBitrate 的 60%；
 *                                                      - 如果您追求“允许模糊但要保持流畅”的效果，可以设置 minVideoBitrate 为 200kbps；
 *                                                      - 如果您将 videoBitrate 和 minVideoBitrate 设置为同一个值，等价于关闭 SDK 的自适应调节能力；
 *                                                      - 默认值：0，此时最低码率由 SDK 根据分辨率情况，自动设置合适的数值。<br>
 *                                                    【特别说明】<br>
 *                                                     - 当您把分辨率设置的比较高时，minVideoBitrate 不适合设置的太低，否则会出现画面模糊和大范围的马赛克宏块。
 *                                                       比如把分辨率设置为 720p，把码率设置为 200kbps，那么编码出的画面将会出现大范围区域性马赛克。
 * @param {Boolean}                 enableAdjustRes - 【字段含义】是否允许调整分辨率<br>
 *                                                    【推荐取值】 <br>
 *                                                     - 手机直播建议选择 NO。<br>
 *                                                     - 视频通话模式，若更关注流畅性，建议选择 YES，此时若遇到带宽有限的弱网，SDK 会自动降低分辨率以保障更好的流畅度（仅针对 TRTCVideoStreamTypeBig 生效）。
 *                                                     - 默认值：NO。<br>
 *                                                    【特别说明】若有录制需求，选择 YES 时，请确保通话过程中，调整分辨率不会影响您的录制效果。<br>
 */
export class TRTCVideoEncParam {
  public videoResolution: TRTCVideoResolution;
  public resMode: TRTCVideoResolutionMode;
  public videoFps: number;
  public videoBitrate: number;
  public minVideoBitrate: number;
  public enableAdjustRes: boolean;
  constructor(
    videoResolution = TRTCVideoResolution.TRTCVideoResolution_640_360,
    resMode = TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape,
    videoFps = 15,
    videoBitrate = 550,
    minVideoBitrate = 0,
    enableAdjustRes = false,
  ) {
    this.videoResolution = videoResolution;
    this.resMode = resMode;
    this.videoFps = videoFps;
    this.videoBitrate = videoBitrate;
    this.minVideoBitrate = minVideoBitrate;
    this.enableAdjustRes = enableAdjustRes;
  }
}

/**
 * 5.3 画面渲染参数
 *
 * 您可以通过设置此参数来控制画面的旋转、填充、镜像模式
 *
 * @param {TRTCVideoRotation} rotation  - 【字段含义】视频画面旋转方向
 * @param {TRTCVideoFillMode} fillMode  - 【字段含义】视频画面填充模式
 * @param {TRTCVideoMirrorType} mirrorType  - 【字段含义】画面渲染镜像类型
 *
 */
export class TRTCRenderParams {
  public rotation: TRTCVideoRotation;
  public fillMode: TRTCVideoFillMode;
  public mirrorType: TRTCVideoMirrorType;
  constructor(rotation = TRTCVideoRotation.TRTCVideoRotation0, fillMode = TRTCVideoFillMode.TRTCVideoFillMode_Fit, mirrorType = TRTCVideoMirrorType.TRTCVideoMirrorType_Disable) {
    this.rotation = rotation;
    this.fillMode = fillMode;
    this.mirrorType = mirrorType;
  }
}

/**
 * 5.4 网络流控相关参数
 *
 * 网络流控相关参数，该设置决定了SDK在各种网络环境下的调控方向（比如弱网下是“保清晰”还是“保流畅”）
 *
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
 * 5.5 视频质量
 *
 * 表示视频质量的好坏，通过这个数值，您可以在 UI 界面上用图标表征 userId 的通话线路质量
 *
 * @param {String}      userId  - 用户标识
 * @param {TRTCQuality} quality - 视频质量
 *
 */
export class TRTCQualityInfo {
  public userId: string;
  public quality: TRTCQuality;
  constructor(userId = '', quality = TRTCQuality.TRTCQuality_Unknown) {
    this.userId = userId;
    this.quality = quality;
  }
}

/**
 * 5.6 音量大小
 *
 * 表示语音音量的评估大小，通过这个数值，您可以在 UI 界面上用图标表征 userId 是否有在说话。
 *
 * @param {String} userId - 说话者的 userId，字符编码格式是 UTF-8
 * @param {Number} volume - 说话者的音量， 取值范围0 - 100
 *
 */
export class TRTCVolumeInfo {
  public userId: string;
  public volume: number;
  constructor(userId = '', volume = 0) {
    this.userId = userId;
    this.volume = volume;
  }
}

/**
 * 5.8 网络测速结果
 *
 * 您可以在用户进入房间前通过 TRTCCloud 的 startSpeedTest 接口进行测速 （注意：请不要在通话中调用），
 * 测速结果会每2 - 3秒钟返回一次，每次返回一个 IP 地址的测试结果。
 *
 * 注意:
 * - quality 是内部通过评估算法测算出的网络质量，loss 越低，rtt 越小，得分也就越高。
 * - upLostRate 是指上行丢包率，例如0.3代表每向服务器发送10个数据包，可能有3个会在中途丢失。
 * - downLostRate 是指下行丢包率，例如0.2代表从服务器每收取10个数据包，可能有2个会在中途丢失。
 * - rtt 是指当前设备到腾讯云服务器的一次网络往返时间，正常数值在10ms - 100ms之间。
 *
 * @param {String}      ip           - 服务器 IP 地址
 * @param {TRTCQuality} quality      - 网络质量，内部通过评估算法测算出的网络质量，loss 越低，rtt 越小，得分也就越高
 * @param {Number}      upLostRate   - 上行丢包率，范围是[0 - 1.0]，例如0.3代表每向服务器发送10个数据包，可能有3个会在中途丢失。
 * @param {Number}      downLostRate - 下行丢包率，范围是[0 - 1.0]，例如0.2代表从服务器每收取10个数据包，可能有2个会在中途丢失。
 * @param {Number}      rtt          - 延迟（毫秒），代表 SDK 跟服务器一来一回之间所消耗的时间，这个值越小越好，正常数值在10ms - 100ms之间。
 *
 */
export class TRTCSpeedTestResult {
  public ip: string;
  public quality: TRTCQuality;
  public upLostRate: number;
  public downLostRate: number;
  public rtt: number;
  constructor(ip = '', quality = TRTCQuality.TRTCQuality_Unknown, upLostRate = 0.0, downLostRate = 0.0, rtt = 0) {
    this.ip = ip;
    this.quality = quality;
    this.upLostRate = upLostRate;
    this.downLostRate = downLostRate;
    this.rtt = rtt;
  }
}

/**
 * 记录矩形的四个点坐标
 *
 * @param {Number} left   - 左坐标
 * @param {Number} top    - 上坐标
 * @param {Number} right  - 右坐标
 * @param {Number} bottom - 下坐标
 *
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

/**
 * 5.9 云端混流中每一路子画面的位置信息
 *
 * TRTCMixUser 用于指定每一路（即每一个 userId）视频画面的具体摆放位置
 *
 * @param {String}              userId      - 参与混流的 userId
 * @param {String}              roomId      - 参与混流的 roomId，跨房流传入的实际 roomId，当前房间流传入 roomId = ''
 * @param {Rect}                rect        - 图层位置坐标以及大小，左上角为坐标原点(0,0) （绝对像素值）
 * @param {Number}              rect.left   - 图层位置的左坐标
 * @param {Number}              rect.top    - 图层位置的上坐标
 * @param {Number}              rect.right  - 图层位置的右坐标
 * @param {Number}              rect.bottom - 图层位置的下坐标
 * @param {Number}              zOrder      - 图层层次（1 - 15）不可重复
 * @param {Boolean}             pureAudio   - 是否纯音频
 * @param {TRTCVideoStreamType} streamType  - 参与混合的是主路画面（TRTCVideoStreamTypeBig）或屏幕分享（TRTCVideoStreamTypeSub）画面
 *
 */
export class TRTCMixUser {
  public userId: string;
  public roomId: string;
  public rect: null | Rect;
  public zOrder: number;
  public pureAudio: boolean;
  public streamType: TRTCVideoStreamType;
  constructor(userId = '', roomId = '', rect: null | Rect = null, zOrder = 0, pureAudio = false, streamType = TRTCVideoStreamType.TRTCVideoStreamTypeBig) {
    this.userId = userId;
    this.roomId = roomId;
    this.rect = rect;
    this.zOrder = zOrder;
    this.pureAudio = pureAudio;
    this.streamType = streamType;
  }
}

/**
 * 5.10 混流参数配置模式
 *
 * 目前暂仅支持手动配置这一种模式，即需要指定 TRTCTranscodingConfig 的全部参数。
 *
 * @enum {Number}
 *
 */
const TRTCTranscodingConfigMode_HACK_JSDOC = {
  /** 非法值 */
  TRTCTranscodingConfigMode_Unknown: 0,

  /** 全手动模式，灵活性最高，可以自由组合出各种混流方案，但易用性最差。
   * 此模式下，您需要填写 TRTCTranscodingConfig 中的所有参数，并需要监听 TRTCCloudDelegate 中的 onUserVideoAvailable() 和 onUserAudioAvailable() 回调，
   * 以便根据当前房间中各个上麦用户的音视频状态不断地调整 mixUsers 参数，否则会导致混流失败。
   */
  TRTCTranscodingConfigMode_Manual: 1,

  /** 纯音频模式，适用于语音通话（AudioCall）和语音聊天室（VoiceChatRoom）等纯音频场景。
   * 只需要在进房后通过 setMixTranscodingConfig() 接口设置一次，之后 SDK 就会自动把房间内所有上麦用户的声音混流到当前用户的直播流上。
   * 此模式下，您无需设置 TRTCTranscodingConfig 中的 mixUsers 参数，只需设置 audioSampleRate、audioBitrate 和 audioChannels 等参数。
   */
  TRTCTranscodingConfigMode_Template_PureAudio: 2,

  /** 预排版模式，通过占位符提前对各路画面进行排布
   * 此模式下，您依然需要设置 mixUsers 参数，但可以将 userId 设置为占位符，可选的占位符有：
   * - "$PLACE_HOLDER_REMOTE$"     :  指代远程用户的画面，可以设置多个。
   * - "$PLACE_HOLDER_LOCAL_MAIN$" ： 指代本地摄像头画面，只允许设置一个。
   * - "$PLACE_HOLDER_LOCAL_SUB$"  :  指代本地屏幕分享画面，只允许设置一个。
   * 但是您可以不需要监听 TRTCCloudDelegate 中的 onUserVideoAvailable() 和 onUserAudioAvailable() 回调进行实时调整，
   * 只需要在进房成功后调用一次 setMixTranscodingConfig() 即可，之后 SDK 会自动将真实的 userId 补位到您设置的占位符上。
   */
  TRTCTranscodingConfigMode_Template_PresetLayout: 3,

  /** 屏幕分享模式，适用于在线教育场景等以屏幕分享为主的应用场景，仅支持 Windows 和 Mac 两个平台的 SDK。
   * SDK 会先根据您（通过 videoWidth 和 videoHeight 参数）设置的目标分辨率构建一张画布，
   * 当老师未开启屏幕分享时，SDK 会将摄像头画面等比例拉伸绘制到该画布上；当老师开启屏幕分享之后，SDK 会将屏幕分享画面绘制到同样的画布上。
   * 这样操作的目的是为了确保混流模块的输出分辨率一致，避免课程回放和网页观看的花屏问题（网页播放器不支持可变分辨率）。
   *
   * 由于教学模式下的视频内容以屏幕分享为主，因此同时传输摄像头画面和屏幕分享画面是非常浪费带宽的。
   * 推荐的做法是直接将摄像头画面通过 setLocalVideoRenderCallback 接口自定义绘制到当前屏幕上。
   * 在该模式下，您无需设置 TRTCTranscodingConfig 中的 mixUsers 参数，SDK 不会混合学生的画面，以免干扰屏幕分享的效果。
   *
   * 您可以将 TRTCTranscodingConfig 中的 width × height 设为 0px × 0px，SDK 会自动根据用户当前屏幕的宽高比计算出一个合适的分辨率：
   * - 如果老师当前屏幕宽度 <= 1920px，SDK 会使用老师当前屏幕的实际分辨率。
   * - 如果老师当前屏幕宽度 > 1920px，SDK 会根据当前屏幕宽高比，选择 1920x1080(16:9)、1920x1200(16:10)、1920x1440(4:3) 三种分辨率中的一种。
   */
  TRTCTranscodingConfigMode_Template_ScreenSharing: 4,
};

export enum TRTCTranscodingConfigMode {
  TRTCTranscodingConfigMode_Unknown = 0,
  TRTCTranscodingConfigMode_Manual = 1,
  TRTCTranscodingConfigMode_Template_PureAudio = 2,
  TRTCTranscodingConfigMode_Template_PresetLayout = 3,
  TRTCTranscodingConfigMode_Template_ScreenSharing = 4,
  TRTC_TranscodingConfigMode_Unknown = 5,
  TRTC_TranscodingConfigMode_Manual = 6,
  TRTC_TranscodingConfigMode_Template_PureAudio = 7,
  TRTC_TranscodingConfigMode_Template_PresetLayout = 8,
  TRTC_TranscodingConfigMode_Template_ScreenSharing = 9,
}

/**
 * 5.11 云端混流（转码）配置
 *
 * 包括最终编码质量和各路画面的摆放位置
 *
 * @param {TRTCTranscodingConfigMode} mode - 【字段含义】转码 config 模式
 * @param {Number} appId - 【字段含义】腾讯云直播 AppID<br>
 *                         【推荐取值】请在 [实时音视频控制台](https://console.cloud.tencent.com/rav) 选择已经创建的应用，单击【帐号信息】后，在“直播信息”中获取
 * @param {Number} bizId - 【字段含义】腾讯云直播 bizid<br>
 *                         【推荐取值】请在 [实时音视频控制台](https://console.cloud.tencent.com/rav) 选择已经创建的应用，单击【帐号信息】后，在“直播信息”中获取
 * @param {Number} videoWidth   - 【字段含义】最终转码后的视频分辨率的宽度。<br>
 *                                【推荐取值】推荐值：360px ，如果你是纯音频推流，请将 width × height 设为 0px × 0px，否则混流后会携带一条画布背景的视频流。
 * @param {Number} videoHeight  - 【字段含义】最终转码后的视频分辨率的高度。<br>
 *                                【推荐取值】推荐值：640px ，如果你是纯音频推流，请将 width × height 设为 0px × 0px，否则混流后会携带一条画布背景的视频流。
 * @param {Number} videoBitrate - 【字段含义】最终转码后的视频分辨率的码率（kbps）<br>
 *                                【推荐取值】如果填0，后台会根据videoWidth和videoHeight来估算码率，您也可以参考枚举定义TRTCVideoResolution_640_480的注释。
 * @param {Number} videoFramerate  - 【字段含义】最终转码后的视频分辨率的帧率（FPS）<br>
 *                                   【推荐取值】默认值：15fps，取值范围是 (0,30]。
 * @param {Number} videoGOP        - 【字段含义】最终转码后的视频分辨率的关键帧间隔（又称为 GOP）。<br>
 *                                   【推荐取值】默认值：2，单位为秒，取值范围是 [1,8]。
 * @param {Number} backgroundColor - 【字段含义】混合后画面的底色颜色，默认为黑色，格式为十六进制数字，比如：“0x61B9F1” 代表 RGB 分别为(97,158,241)。<br>
 *                                   【推荐取值】默认值：0x000000，黑色
 * @param {String} backgroundImage - 【字段含义】混合后画面的背景图。<br>
 *                                   【推荐取值】默认值：''，即不设置背景图<br>
 *                                   【特别说明】背景图需要您事先在 “[控制台](https://console.cloud.tencent.com/trtc) => 应用管理 => 功能配置 => 素材管理” 中上传，<br>
 *                                    上传成功后可以获得对应的“图片ID”，然后将“图片ID”转换成字符串类型并设置到 backgroundImage 里即可。<br>
 *                                    例如：假设“图片ID” 为 63，可以设置 backgroundImage = @"63";
 * @param {Number} audioSampleRate - 【字段含义】最终转码后的音频采样率。<br>
 *                                   【推荐取值】默认值：48000Hz。支持12000HZ、16000HZ、22050HZ、24000HZ、32000HZ、44100HZ、48000HZ。
 * @param {Number} audioBitrate    - 【字段含义】最终转码后的音频码率。<br>
 *                                   【推荐取值】默认值：64kbps，取值范围是 [32，192]。
 * @param {Number} audioChannels   - 【字段含义】最终转码后的音频声道数<br>
 *                                   【推荐取值】默认值：1。取值范围为 [1,2] 中的整型。
 * @param {TRTCMixUser[]} mixUsersArray - 【字段含义】每一路子画面的位置信息
 * @param {String} streamId        - 【字段含义】输出到 CDN 上的直播流 ID。<br>
 *                                    如不设置该参数，SDK 会执行默认逻辑，即房间里的多路流会混合到该接口调用者的视频流上，也就是 A+B =>A；<br>
 *                                    如果设置该参数，SDK 会将房间里的多路流混合到您指定的直播流 ID 上，也就是 A+B =>C。<br>
 *                                   【推荐取值】默认值：''，即房间里的多路流会混合到该接口调用者的视频流上。
 */
export class TRTCTranscodingConfig {
  public mode: TRTCTranscodingConfigMode;
  public appId: number;
  public bizId: number;
  public videoWidth: number;
  public videoHeight: number;
  public videoBitrate: number;
  public videoFramerate: number;
  public videoGOP: number;
  public backgroundColor: number;
  public backgroundImage: string;
  public audioSampleRate: number;
  public audioBitrate: number;
  public audioChannels: number;
  public mixUsersArray: TRTCMixUser[];
  public streamId: string;
  constructor(
    mode = TRTCTranscodingConfigMode.TRTCTranscodingConfigMode_Unknown,
    appId = 0,
    bizId = 0,
    videoWidth = 0,
    videoHeight = 0,
    videoBitrate = 0,
    videoFramerate = 15,
    videoGOP = 2,
    backgroundColor = 0,
    backgroundImage = '',
    audioSampleRate = 64,
    audioBitrate = 48000,
    audioChannels = 1,
    mixUsersArray = [],
    streamId = '',
  ) {
    this.mode = mode;
    this.appId = appId;
    this.bizId = bizId;
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
    this.videoBitrate = videoBitrate;
    this.videoFramerate = videoFramerate;
    this.videoGOP = videoGOP;
    this.backgroundColor = backgroundColor;
    this.backgroundImage = backgroundImage;
    this.audioSampleRate = audioSampleRate;
    this.audioBitrate = audioBitrate;
    this.audioChannels = audioChannels;
    this.mixUsersArray = mixUsersArray;
    this.streamId = streamId;
  }
}

/**
 * 5.12 CDN 旁路推流参数
 *
 * @param {Number} appId - 腾讯云 AppID，请在 [实时音视频控制台](https://console.cloud.tencent.com/rav) 选择已经创建的应用，单击【帐号信息】后，在“直播信息”中获取
 * @param {Number} bizId - 腾讯云直播 bizId，请在 [实时音视频控制台](https://console.cloud.tencent.com/rav) 选择已经创建的应用，单击【帐号信息】后，在“直播信息”中获取
 * @param {String} url - 旁路转推的 URL
 *
 */
export class TRTCPublishCDNParam {
  public appId: number;
  public bizId: number;
  public url: null | string;
  constructor(appId = 0, bizId = 0, url: null | string = null) {
    this.appId = appId;
    this.bizId = bizId;
    this.url = url;
  }
}

/**
 * 5.13 录音参数
 *
 * 请正确填写参数，确保录音文件顺利生成。
 *
 * @param {String} filePath - 【字段含义】文件路径（必填），录音文件的保存路径。该路径需要用户自行指定，请确保路径存在且可写。<br>
 *                            【特别说明】该路径需精确到文件名及格式后缀，格式后缀决定录制文件的格式，例如：指定路径为 path/to/audio.aac，则会生成一个 AAC 格式的文件。目前支持的格式有 PCM, WAV, AAC
 *
 */
export class TRTCAudioRecordingParams {
  public filePath: null | string;
  constructor(filePath: null | string = null) {
    this.filePath = filePath;
  }
}

/**
 * 5.14 音效
 *
 * @param {Number} effectId  - 【字段含义】音效 ID<br>
 *                             【特殊说明】SDK 允许播放多路音效，因此需要音效 ID 进行标记，用于控制音效的开始、停止、音量等
 * @param {String} path      - 【字段含义】音效路径
 * @param {Number} loopCount - 【字段含义】循环播放次数<br>
 *                             【推荐取值】取值范围为0 - 任意正整数，默认值：0。0表示播放音效一次；1表示播放音效两次；以此类
 * @param {Boolean} publish  - 【字段含义】音效是否上行<br>
 *                             【推荐取值】YES：音效在本地播放的同时，会上行至云端，因此远端用户也能听到该音效；NO：音效不会上行至云端，因此只能在本地听到该音效。默认值：NO
 * @param {Number} volume    - 【字段含义】音效音量<br>
 *                             【推荐取值】取值范围为0 - 100；默认值：100
 */
export class TRTCAudioEffectParam {
  public effectId: number;
  public path: string;
  public loopCount: number;
  public publish: boolean;
  public volume: number;
  constructor(effectId = 0, path = '', loopCount = 0, publish = false, volume = 100) {
    this.effectId = effectId;
    this.path = path;
    this.loopCount = loopCount;
    this.publish = publish;
    this.volume = volume;
  }
}

/**
 * 本地的音视频统计信息
 *
 * @param {Number} width           - 视频宽度
 * @param {Number} height          - 视频高度
 * @param {Number} frameRate       - 帧率（fps）
 * @param {Number} videoBitrate    - 视频发送码率（Kbps）
 * @param {Number} audioSampleRate - 音频采样率（Hz）
 * @param {Number} audioBitrate    - 音频发送码率（Kbps）
 * @param {TRTCVideoStreamType} streamType - 流类型（大画面 | 小画面 | 辅路画面）
 *
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
 * 远端成员的音视频统计信息
 *
 * @param {String} userId          - 用户 ID，指定是哪个用户的视频流
 * @param {Number} finalLoss       - 该线路的总丢包率（％）
 *                                   这个值越小越好，比如：0%的丢包率代表网络很好。
 *                                   这个丢包率是该线路的 userId 从上行到服务器再到下行的总丢包率。
 *                                   如果 downLoss 为 0%, 但是 finalLoss 不为0%，说明该 userId 在上行就出现了无法恢复的丢包。
 * @param {Number} width           - 视频宽度
 * @param {Number} height          - 视频高度
 * @param {Number} frameRate       - 接收帧率（fps）
 * @param {Number} videoBitrate    - 视频码率（Kbps）
 * @param {Number} audioSampleRate - 音频采样率（Hz）
 * @param {Number} audioBitrate    - 音频码率（Kbps）
 * @param {Number} jitterBufferDelay    - 播放时延（ms）
 * @param {Number} audioTotalBlockTime    - 音频播放卡顿累计时长（ms）
 * @param {Number} audioBlockRate    - 音频播放卡顿率，音频卡顿累计时长占音频总播放时长的百分比 (%)
 * @param {Number} videoTotalBlockTime    - 视频播放卡顿累计时长（ms）
 * @param {Number} videoBlockRate    - 视频播放卡顿率，视频卡顿累计时长占音频总播放时长的百分比（%）
 * @param {TRTCVideoStreamType} streamType - 流类型（大画面 | 小画面 | 辅路画面）
 *
 */
export class TRTCRemoteStatistics {
  public userId: string;
  public finalLoss: number;
  public width: number;
  public height: number;
  public frameRate: number;
  public videoBitrate: number;
  public audioSampleRate: number;
  public audioBitrate: number;
  public jitterBufferDelay: number;
  public audioTotalBlockTime: number;
  public audioBlockRate: number;
  public videoTotalBlockTime: number;
  public videoBlockRate: number;
  public streamType: TRTCVideoStreamType;
  constructor(
    userId = '',
    finalLoss = 0,
    width = 0,
    height = 0,
    frameRate = 0,
    videoBitrate = 0,
    audioSampleRate = 0,
    audioBitrate = 0,
    jitterBufferDelay = 0,
    audioTotalBlockTime = 0,
    audioBlockRate = 0,
    videoTotalBlockTime = 0,
    videoBlockRate = 0,
    streamType = TRTCVideoStreamType.TRTCVideoStreamTypeBig,
  ) {
    this.userId = userId;
    this.finalLoss = finalLoss;
    this.width = width;
    this.height = height;
    this.frameRate = frameRate;
    this.videoBitrate = videoBitrate;
    this.audioSampleRate = audioSampleRate;
    this.audioBitrate = audioBitrate;
    this.jitterBufferDelay = jitterBufferDelay;
    this.audioTotalBlockTime = audioTotalBlockTime;
    this.audioBlockRate = audioBlockRate;
    this.videoTotalBlockTime = videoTotalBlockTime;
    this.videoBlockRate = videoBlockRate;
    this.streamType = streamType;
  }
}

/**
 * 统计数据
 *
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
 *
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
  public remoteStatisticsArray: TRTCRemoteStatistics[];
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
    remoteStatisticsArray: TRTCRemoteStatistics[] = [],
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
    this.remoteStatisticsArray = remoteStatisticsArray;
    this.remoteStatisticsArraySize = remoteStatisticsArraySize;
  }
}

/**
 * 音乐参数
 *
 * @param {Number} id    - 音乐 ID
 * @param {String} path  - 音乐文件的绝对路径
 * @param {Number} loopCount  - 音乐循环播放的次数
 * @param {Boolean} publish  - 是否将音乐传到远端
 * @param {Boolean} isShortFile  - 播放的是否为短音乐文件
 * @param {Number} startTimeMS  - 音乐开始播放时间点，单位毫秒
 * @param {Number} endTimeMS  - 音乐结束播放时间点，单位毫秒，0表示播放至文件结尾。
 *
 */
export class AudioMusicParam {
  public id: number;
  public path: string;
  public loopCount: number;
  public publish: boolean;
  public isShortFile: boolean;
  public startTimeMS: number;
  public endTimeMS: number;
  constructor(id = 0, path = '', loopCount = 0, publish = true, isShortFile = false, startTimeMS = 0, endTimeMS = 0) {
    this.id = id;
    this.path = path;
    this.loopCount = loopCount;
    this.publish = publish;
    this.isShortFile = isShortFile;
    this.startTimeMS = startTimeMS;
    this.endTimeMS = endTimeMS;
  }
}

/**
 * 房间切换参数
 *
 * @param {Number} roomId    - 房间ID，在同一个房间内的用户可以看到彼此并进行视频通话, 若您选用 strRoomId，则 roomId 需要填写为0。
 * @param {String} strRoomId    - 字符串房间号码 [选填]，在同一个房间内的用户可以看到彼此并进行视频通话, roomId 和 strRoomId 必须填一个。若两者都填，则优先选择 roomId。
 * @param {String} userSig    - 用户签名 [选填]，当前 userId 对应的验证签名，相当于登录密码。不填时，SDK 会继续使用旧的 userSig，
 *                               但用户必须保证旧的 userSig 仍在有效期内，否则会造成进房失败等后果。
 * @param {String} privateMapKey - 房间签名 [选填]，当您希望某个房间只能让特定的 userId 进入时，需要使用 privateMapKey 进行权限保护。
 *
 */
export class TRTCSwitchRoomParam {
  public roomId: number;
  public strRoomId: string;
  public userSig: string;
  public privateMapKey: string;
  constructor(roomId = 0, strRoomId = '', userSig = '', privateMapKey = '') {
    this.roomId = roomId;
    this.strRoomId = strRoomId;
    this.userSig = userSig;
    this.privateMapKey = privateMapKey;
  }
}

export interface VideoFramePayload {
  uid: string;
  type: TRTCVideoStreamType;
  rotation: TRTCVideoRotation;
  timestamp: number;
  data: {
    width: number;
    height: number;
    data: ArrayBuffer; // BGRA 数据
  };
}

export interface PluginInfo {
  id: string;
  enable: () => number;
  disable: () => number;
  setParameter: (param: string) => number;
  getParameter: (paramKey: string) => string;
}
