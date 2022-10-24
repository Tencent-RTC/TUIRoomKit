/**
 * Room统一接口
 *
 * 接口设计原则：
 *  （1）主动调用且需要处理异步响应的，定义为异步的 Promise 接口，
 * 如：进房接口（这一点与 TRTC 接口不同，TRTC 主动调用需要等待异步响应的接口，
 * 都是通过事件处理的异步响应）
 *  （2）需要被动触发的接口，通过事件接口实现，如：远端用户进房事件接口
 */
 import {
  TRTCDeviceInfo,
  TRTCAudioQuality,
  TRTCScreenCaptureSourceInfo,
  TRTCBeautyStyle,
  TRTCVideoQosPreference,
  TRTCVideoEncParam,
  TRTCVideoFillMode,
} from './trtc_define';
import { ETUISpeechMode, ETUIStreamType } from './types';
import TUIRoomInfo from './base/TUIRoomInfo';
import TUIRoomUser from './base/TUIRoomUser';
import TUIRoomResponse from './base/TUIRoomResponse';

export default interface ITUIRoomCore {
  /**
   * 以下 创建 和 销毁 单例的方法声明注释掉，因为 eslint 的 TS 的
   * 接口继承会提示错误，对 static 方法支持不是很好。
   */
  // /**
  //  * 获取单例实例
  //  */
  // getInstance: () => ITUIRoomCore;

  // /**
  //  * 销毁单例实例
  //  */
  // destroyInstance: () => void;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   基础接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 登录
   *
   * 主要是登录 TIM
   *
   * @param {number} sdkAppId - sdkAppId
   * @param {string} userId - 用户Id
   * @param {string} userSig - 用户签名
   * @returns {Promise}
   */
  login: (
    sdkAppId: number,
    userId: string,
    userSig: string
  ) => Promise<TUIRoomResponse<any>>;

  /**
   * 登出
   *
   * @returns {Promise}
   */
  logout: () => Promise<TUIRoomResponse<any>>;

  /**
   * 创建房间
   *
   * 主持人创建房间，内部需要同时实现 TIM 建群和 TRTC 进房。
   * 如果 TIM 群已存在，切当前用户是群主，则加入群组；
   * 如果群租已存在，当前用户不是群主，提示房间号已被占用。
   * @param {number} roomId 房间号
   * @param {ETUISpeechMode} mode 发言模式，默认为“申请发言”模式
   * @returns {Promise}
   */
  createRoom: (
    roomId: number,
    mode: ETUISpeechMode
  ) => Promise<TUIRoomResponse<any>>;

  /**
   * 销毁房间
   *
   * 主持人销毁房间，内部需要同时实现 TIM 解散群和 TRTC 退房。观众端会收到房间销毁事件通知 onRoomDestroyed.
   * 需要先退出 TRTC 房间，再解散 TIM 群组。
   * @returns {Promise}
   */
  destroyRoom: () => Promise<TUIRoomResponse<any>>; //

  /**
   * 进入房间
   *
   * @param {number} roomId 房间号
   * @returns {Promise}
   */
  enterRoom: (roomId: number) => Promise<TUIRoomResponse<any>>;

  /**
   * 离开房间
   *
   * 内部需要同时实现 TIM 退群和 TRTC 退房
   * @returns {Promise}
   */
  exitRoom: () => Promise<TUIRoomResponse<any>>;

  /**
   * 获取房间信息
   *
   * @returns {TUIRoomInfo}
   */
  getRoomInfo: () => TUIRoomInfo; // 房间Id、名称、公告等，公告信息在UI层如何使用各端不一致，暴露出来可以兼容各端

  /**
   * 获取所有成员信息
   *
   * @returns {Array<TUIRoomUser>}
   */
  getRoomUsers: () => Array<TUIRoomUser>;

  /**
   * 获取指定用户信息
   *
   * @param {string} userId 成员Id
   * @returns {Promise<Object | null>}
   */
  getUserInfo: (userId: string) => Promise<Object | null>;

  /**
   * 设置用户名和头像
   *
   * @param {string} name 用户名
   * @param {string} avatarURL 头像地址
   */
  setSelfProfile: (name: string, avatarURL: string) => void;

  /**
   * 将房间转交给其他成员
   *
   * @param {string} userId 主持人将房间控制权转交给其他成员, 观众端会收到事件通知 onRoomMasterChanged.
   * @returns {Promise}
   */
  transferRoomMaster: (userId: string) => Promise<TUIRoomResponse<any>>;

  // /**
  //  * 退出TRTC房间（多窗口需要的特殊接口）
  //  *
  //  * @returns {Promise}
  //  */
  // leaveTRTCRoom: () => Promise<TUIRoomResponse<any>>;

  // /**
  //  * 进入TRTC房间（多窗口需要的特殊接口）
  //  *
  //  * @returns {Promise}
  //  */
  // enterTRTCRoom: (roomId: string) => Promise<TUIRoomResponse<any>>;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   TRTC 相关接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 设置视频编码参数
   */
  setVideoEncoderParam: (paramObj: TRTCVideoEncParam) => void;

  /**
   * 打开本地摄像头
   *
   * @param {HTMLElement} view 显示本地摄像头的 div 元素
   */
  startCameraPreview: (view: HTMLElement) => void;

  /**
   * 关闭本地摄像头
   */
  stopCameraPreview: () => void;

  /**
   * 开启本地麦克风
   *
   * @param {TRTCAudioQuality} quality 音频采集质量
   */
  startMicrophone: (quality: TRTCAudioQuality) => void;

  /**
   * 关闭本地麦克风
   */
  stopMicrophone: () => void;

  /**
   * 开始测试摄像头设备
   */
  startCameraDeviceTest: (view: HTMLElement) => void;

  /**
   * 停止测试摄像头设备
   */
  stopCameraDeviceTest: () => void;

  /**
   * 开启系统声音的采集
   *
   * 调用该接口后会开启系统声音采集。
   * 屏幕分享或者开始背景音乐时，建议调用该接口，开启系统声音采集，否则远端听到的声音容易卡顿、延迟。
   */
  startSystemAudioLoopback: () => void;

  /**
   * 关闭系统声音的采集
   * 调用该接口后会关闭系统声音采集。
   */
  stopSystemAudioLoopback: () => void;

  /**
   * 镜像设置：该设置视频是否进行镜像翻转
   *
   * @param mirror   true开启镜像, false 关闭镜像。
   */
  setVideoMirror: (mirror: boolean) => void;

  /**
   * 渲染模式设置：设置远端视频渲染模式
   * @param userId 用户 Id
   * @param streamType 流类型
   * @param fillMode 填充模式
   */
  setRemoteVideoFillMode: (userId: string, streamType: ETUIStreamType, fillMode: TRTCVideoFillMode) => void;

  /**
   * 静默或取消静默本地摄像头
   */
  muteLocalCamera: (mute: boolean) => void;

  /**
   * 静默或取消静默本地麦克风
   */
  muteLocalMicrophone: (mute: boolean) => void;

  /**
   * 拉取远端视频流
   *
   * 根据类型，支持拉取远端主流（摄像头）和辅助（屏幕分享）
   * @param {string} userId 成员Id
   * @param {HTMLDivElement} view 显示远端视频流的 div 元素
   * @param {ETUIStreamType} streamType 视频流类型：摄像头或者屏幕分享
   */
  startRemoteView: (
    userId: string,
    view: HTMLDivElement,
    streamType: ETUIStreamType
  ) => void;

  /**
   * 停止拉取远端视频流
   *
   * @param {string} userId 成员Id
   * @param {ETUIStreamType} streamType 视频流类型：摄像头或者屏幕分享
   */
  stopRemoteView: (userId: string, streamType: ETUIStreamType) => void;

  /**
   * 静默/取消静默远端摄像头视频流
   *
   * @param {string} userId 成员Id
   * @param {boolean} mute true: 静默，false: 取消静默
   */
  muteRemoteCamera: (userId: string, mute: boolean) => void;

  /**
   * 静默/取消静默远端麦克风音频流
   *
   * @param {string} userId 成员Id
   * @param {boolean} mute true: 静默，false: 取消静默
   */
  muteRemoteAudio: (userId: string, mute: boolean) => void;

  /**
   * 启用或关闭音量大小提示
   *
   * 开启此功能后，SDK 会在 onUserVoiceVolume() 中反馈对每一路声音音量大小值的评估。
   * 我们在 Demo 中有一个音量大小的提示条，就是基于这个接口实现的。
   * 如希望打开此功能，请在 startLocalAudio() 之前调用。
   *
   * @param {number} interval - 设置 onUserVoiceVolume 回调的触发间隔，单位为ms，最小间隔为100ms，如果小于等于0则会关闭回调，建议设置为300ms
   */
  enableAudioVolumeEvaluation: (interval: number) => void;

  /**
   * 获取可分享的屏幕和窗口列表
   *
   * @returns {Array<TRTCScreenCaptureSourceInfo>} 屏幕和窗口数据列表
   */
  getScreenCaptureSources: (
    thumbWidth: number,
    thumbHeight: number,
    iconWidth: number,
    iconHeight: number
  ) => Array<TRTCScreenCaptureSourceInfo>;

  /**
   * 开始屏幕分享
   *
   * @param {HTMLDivElement} view 本地显示屏幕分享内容的 div 元素
   * @param {TRTCVideoEncParam} params TRTC 视频参数，非必填。
   */
  startScreenCapture: (
    view: HTMLDivElement | null,
    params?: TRTCVideoEncParam
  ) => Promise<TUIRoomResponse<any>>;

  /**
   * 暂停屏幕分享
   */
  pauseScreenCapture: () => Promise<TUIRoomResponse<any>>;

  /**
   * 恢复屏幕分享
   */
  resumeScreenCapture: () => Promise<TUIRoomResponse<any>>;

  /**
   * 结束屏幕分享
   */
  stopScreenCapture: () => Promise<TUIRoomResponse<any>>;

  /**
   * 启动白板分享（特殊的屏幕分享）
   *
   * 共享白，基于屏幕共享实现。停止、恢复、结束白板分享，重用对应屏幕分享相关接口。
   */
  startWhiteboardCapture: () => Promise<TUIRoomResponse<any>>;

  /**
   * 获取麦克风设备列表
   *
   * @returns {Promise}
   */
  getMicrophoneList: () => Promise<Array<TRTCDeviceInfo>>;

  /**
   * 获取当前麦克风
   *
   * @returns {TRTCDeviceInfo | null}
   */
  getCurrentMicrophone: () => TRTCDeviceInfo | null;

  /**
   * 切换当前麦克风
   *
   * @param {string} deviceId 设备Id
   * @returns {Promise}
   */
  setCurrentMicrophone: (deviceId: string) => Promise<any>;

  /**
   * 获取摄像头设备列表
   *
   * @returns {Promise}
   */
  getCameraList: () => Promise<Array<TRTCDeviceInfo>>;

  /**
   * 获取当前摄像头
   *
   * @returns {TRTCDeviceInfo | null}
   */
  getCurrentCamera: () => TRTCDeviceInfo | null;

  /**
   * 切换当前摄像头
   *
   * @param {string} deviceId 设备Id
   * @returns {Promise}
   */
  setCurrentCamera: (deviceId: string) => Promise<any>;

  /**
   * 获取扬声器设备列表
   *
   * @returns {Promise}
   */
  getSpeakerList: () => Promise<Array<TRTCDeviceInfo>>;

  /**
   * 获取当前扬声器
   *
   * @returns {TRTCDeviceInfo | null}
   */
  getCurrentSpeaker: () => TRTCDeviceInfo | null;

  /**
   * 切换当前扬声器
   *
   * @param {string} deviceId 设备Id
   * @returns {Promise}
   */
  setCurrentSpeaker: (deviceId: string) => Promise<any>;

  /**
   * 开始云端录制
   */
  startCloudRecord: () => Promise<TUIRoomResponse<any>>;

  /**
   * 结束云端录制
   */
  stopCloudRecord: () => Promise<TUIRoomResponse<any>>;

  /**
   * 设置美颜、美白、红润效果级别
   *
   * TRTC SDK 内部集成了两套风格不同的磨皮算法，一套我们取名叫“光滑”，适用于美女秀场，效果比较明显。
   * 另一套我们取名“自然”，磨皮算法更多地保留了面部细节，主观感受上会更加自然。
   *
   * @param {TRTCBeautyStyle} style - 美颜风格，光滑或者自然，光滑风格磨皮更加明显，适合娱乐场景。
   * - TRTCBeautyStyleSmooth: 光滑，适用于美女秀场，效果比较明显。
   * - TRTCBeautyStyleNature: 自然，磨皮算法更多地保留了面部细节，主观感受上会更加自然。
   * @param {number} beauty    - 美颜级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显
   * @param {number} white     - 美白级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显
   * @param {number} ruddiness - 红润级别，取值范围0 - 9，0表示关闭，1 - 9值越大，效果越明显，该参数 windows 平台暂未生效
   */
  setBeautyStyle: (
    style: TRTCBeautyStyle,
    beauty: number,
    white: number,
    ruddiness: number
  ) => void;

  /**
   * 设置网络流控相关参数
   * 该设置决定了 TRTC SDK 在各种网络环境下的调控策略（例如弱网下是“保清晰”还是“保流畅”）
   *
   * @param {TRTCVideoQosPreference} preference - 弱网下是“保清晰”还是“保流畅”，默认“保清晰“。
   * - TRTCVideoQosPreferenceSmooth: 弱网下保流畅，在遭遇弱网环境时首先确保声音的流畅和优先发送，画面会变得模糊且会有较多马赛克，但可以保持流畅不卡顿。
   * - TRTCVideoQosPreferenceClear : 弱网下保清晰，在遭遇弱网环境时，画面会尽可能保持清晰，但可能会更容易出现卡顿。
   */
  setVideoQosPreference: (preference: TRTCVideoQosPreference) => void;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    IM 相关接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 发送文本消息
   *
   * @param {string} text 消息文本内容
   * @returns {Promise}
   */
  sendChatMessage: (text: string) => Promise<TUIRoomResponse<any>>;

  /**
   * @param {options}
   * @param {options.data} string 发送的自定义消息内容
   * @param {options.description} string 发送的自定义消息描述
   * @param {options.extension} string 发送的自定义消息扩展字段
   */
  sendCustomMessage: (options: {
    data: string,
    description: string,
    extension?: string,
  }) => Promise<TUIRoomResponse<any>>;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    IM 个人资料相关接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */

  /**
   * 更新个人资料
   *
   * @param {string} Object - 个人信息
   * @returns {Promise}
   */
  updateMyProfile: (
    options: { nick: string; avatar: string; }
  ) => Promise<TUIRoomResponse<any>>;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    事件监听注册接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 注册事件监听
   */
  on: (
    eventName: string,
    handler: (...args: any) => void,
    ctx: Record<string, any>
  ) => void;

  /**
   * 取消事件监听
   */
  off: (eventName: string, handler: (...args: any) => void) => void;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                    其他接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 销毁
   */
  destroy: () => void;
}
