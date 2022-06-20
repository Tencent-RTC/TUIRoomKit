import {
  TRTCQualityInfo,
  TRTCStatistics,
  TRTCVolumeInfo,
  TRTCDeviceType,
  TRTCDeviceState,
} from 'trtc-electron-sdk';
import { ETUIStreamType, TTUIUser, TTUIRoomError } from './types.d';

export default interface EventCallback {
  /**
   * 被动触发的异常/错误捕获事件
   * 这里只能处理被动触发的异常/错误，主动调用接口发生的异常/错误只能在返回 Promise 的接口回调中处理
   */
  onError: (error: TTUIRoomError) => void;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   房间管理相关事件接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 房间被销毁的回调，主持人退房时，房间内的所有用户都会收到此事件
   */
  onRoomDestroyed: (roomId: string) => void;

  /**
   * 离开房间通知事件
   *
   * 主动调用 exitRoom 时，不会收到此通知事件，当被主持人踢出房间时，收到此通知事件
   *
   * 注意：Windows 接口说断网导致退房，也会触发此通知事件，Electron 是否需要处理断网导致退房？如何实现？
   */
  onRoomExited: (code: number, message: string) => void;
  // onKickedOff
  /**
   * 主持人转换事件
   *
   * 当前主持人将房间控制权交给其他人时触发
   */
  onRoomMasterChanged: (oldVale: TTUIUser, newValue: TTUIUser) => void;

  /**
   * 新成员进房事件
   */
  onUserEnterRoom: (user: TTUIUser) => void;

  /**
   * 成员退房事件
   */
  onUserLeaveRoom: (user: TTUIUser) => void;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   音视频相关事件接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 成员开启或关闭摄像头/视频分享事件
   *
   * @param {string} userId 成员Id
   * @param {boolean} available 1: 表示开启摄像头或屏幕分享，0: 表示关闭摄像头或屏幕分享
   * @param {ETUIStreamType} streamType 视频流类型：摄像头 或 屏幕分享
   */
  onUserVideoAvailable: (
    userId: string,
    available: boolean,
    streamType: ETUIStreamType
  ) => void;

  /**
   * 成员开启或关闭麦克风事件
   *
   * @param {string} userId 成员Id
   * @param {boolean} available 1: 表示开启麦克风，0: 表示关闭麦克分
   */
  onUserAudioAvailable: (userId: string, available: boolean) => void;

  /**
   * 视频流的第一帧到达事件
   *
   * @param {string} userId 成员Id
   * @param {ETUIStreamType} streamType 视频流类型：摄像头 或 屏幕分享
   * @param {number} width 视频宽度
   * @param {number} height 视频高度
   */
  onFirstVideoFrame: (
    userId: string,
    streamType: number,
    width: number,
    height: number
  ) => void;

  /**
   * 用户音量大小通知事件
   *
   * 可以通过调用 enableAudioVolumeEvaluation() 接口来开关这个回调或者设置它的触发间隔。
   * 需要注意的是，调用 enableAudioVolumeEvaluation 开启音量回调后，无论频道内是否有人说话，都会按设置的时间间隔调用这个回调，
   * 如果没有人说话，则 totalVolume 为0。
   *
   * @param {TRTCVolumeInfo} userVolumes 每位发言者的语音音量，取值范围0 - 100
   * @param {Number} userVolumesCount 发言者的人数，即 userVolumes 数组的大小
   * @param {Number} totalVolume 总的语音音量, 取值范围0 - 100
   */
  onUserVoiceVolume: (
    userVolumes: TRTCVolumeInfo,
    userVolumesCount: number,
    totalVolume: number
  ) => void;

  /**
   * 本地设备通断通知事件
   *
   * @param {String} deviceId - Windows 端返回设备名，Mac 端返回设备 Id
   * @param {TRTCDeviceType} type     - 设备类型
   * @param {TRTCDeviceState} state    - 事件类型
   */
  onDeviceChange: (
    deviceId: string,
    type: TRTCDeviceType,
    state: TRTCDeviceState
  ) => void;

  /**
   * 网络质量通知事件
   *
   * 该回调每2秒触发一次，统计当前网络的上行和下行质量。
   *
   * 注意：userId == '' 代表自己当前的视频质量
   *
   * @param {TRTCQualityInfo} localQuality  - 上行网络质量
   * @param {TRTCQualityInfo[]} remoteQuality - 下行网络质量
   */
  onNetworkQuality: (
    localQuality: TRTCQualityInfo,
    remoteQuality: Array<TRTCQualityInfo>
  ) => void;

  /**
   * 技术指标统计通知事件
   *
   * 如果您是熟悉音视频领域相关术语，可以通过这个回调获取 SDK 的所有技术指标。
   * 如果您是首次开发音视频相关项目，可以只关注 onNetworkQuality 回调。
   *
   * 注意：每2秒回调一次
   *
   * @param {TRTCStatistics} statis - 统计数据，包括本地和远程的
   */
  onStatistics: (statis: TRTCStatistics) => void;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   即时通信相关事件接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 收到文本消息通知事件
   *
   * @param {string} message - 文本消息内容
   * @param {TTUIUser} user - 发送消息的成员
   */
  onReceiveChatMessage: (message: string, user: TTUIUser) => void;

  /**
   * 收到自定义消息通知事件
   * @param {string} message - 自定义消息内容
   * @param {TTUIUser} user - 发送消息的成员
   */
  onReceiveCustomMessage: (message: string, user: TTUIUser) => void;

  /**
   * /////////////////////////////////////////////////////////////////////////////////
   * //
   * //                                   房间管控相关事件接口
   * //
   * /////////////////////////////////////////////////////////////////////////////////
   */
  /**
   * 远端用户开始发言事件
   *
   * @param {TTUIUser} user - 进入发言状态的成员（非主持人）
   */
  onUserEnterSpeechState: (user: TTUIUser) => void;

  /**
   * 远端用户结束发言事件
   *
   * @param {TTUIUser} user - 退出发言状态的成员（非主持人）
   */
  onUserExitSpeechState: (user: TTUIUser) => void;

  /**
   * 收到主持人发言邀请事件
   */
  onReceiveSpeechInvitation: () => void;

  /**
   * 收到主持人取消发言邀请事件
   */
  onReceiveInvitationCancelled: () => void;

  /**
   * 收到主持人发言邀请超时事件
   */
  onReceiveInvitationTimeout: () => void;

  /**
   * 主持人收到成员对发言邀请的回复事件
   * @deprecated Web 端不需要这个事件，直接在 Promise 中处理即可。
   */
  onReceiveReplyToSpeechInvitation: (userId: string, agree: boolean) => void;

  /**
   * 主持人收到成员申请发言事件
   * TUIRoomDef.SpeechMode.NEED_APPLY，用户调用 sendSpeechApplication 接口向主持人申请发言时，
   * 主持人收到的回调，主持人需要操作并调用 replySpeechApplication 接口对申请进行回应。
   *
   * @param {TTUIUser} user - 成员数据
   */
  onReceiveSpeechApplication: (user: TTUIUser) => void;

  /**
   * 主持人收到成员取消申请发言的事件
   * TUIRoomDef.SpeechMode.NEED_APPLY，用户调用 cancelSpeechApplication 接口取消申请发言时，主持人收到此事件。
   *
   * @param {TTUIUser} user - 成员数据
   */
  onSpeechApplicationCancelled: (user: TTUIUser) => void;

  /**
   * 主持人收到成员申请发言的超时事件
   *
   * @param {TTUIUser} user - 成员数据
   */
  onSpeechApplicationTimeout: (user: TTUIUser) => void;

  /**
   * 主持人同意或拒绝发言申请通知时间
   *
   * @param {boolean} agree - true: 同意，false: 拒绝
   * @deprecated
   */
  onReceiveReplyToSpeechApplication: (agree: boolean) => void;

  /**
   * 主持人禁止申请发言通知事件
   *
   * 主持人调用 forbidSpeechApplication 接口时，成员收到此事件。
   *
   * @param {boolean} forbidden - true: 禁止申请发言，false: 允许申请发言
   */
  onSpeechApplicationForbidden: (forbidden: boolean) => void;

  /**
   * 主持人命令发言观众停止发言事件
   *
   * 主持人调用 SendOffSpeaker 或 sendOffAllSpeakers 接口请求用户停止发言后，用户收到次事件，
   * 用户需要在事件处理函数中调用 exitSpeechState 接口停止发言。
   */
  onOrderedToExitSpeechState: () => void;

  /**
   * 主持人开始点名，成员收到的通知事件
   */
  onCallingRollStarted: () => void;

  /**
   * 主持人结束点名，成员收到的通知事件
   */
  onCallingRollStopped: () => void;

  /**
   * 成员回复点名，主持人收到的通知事件
   *
   * @param {TTUIUser} user - 成员数据
   */
  onUserReplyCallingRoll: (user: TTUIUser) => void;

  /**
   * 主持人更改聊天室是否禁言通知事件
   *
   * 主持人调用 muteChatRoom 接口后，成员收到此通知事件。
   *
   * @param {boolean} mute - true: 禁止聊天，false: 允许聊天
   */
  onChatRoomMuted: (mute: boolean) => void;

  /**
   * 主持人设置禁用麦克风通知事件
   *
   * 主动触发的开关麦克风操作不会触发此事件，远端主持人的麦控操作会才会触发此事件。
   * 主持人调用 muteUserMicrophone 或着 muteAllUsersMicrophone 接口时，
   * 相关成员收到此通知事件，收到此事件通知时，麦克风的开启或关闭操作已完成。
   *
   * @param {boolean} mute - true: 主持人要求成员关闭麦克风，false: 主持人允许成员开启麦克风
   */
  onMicrophoneMuted: (mute: boolean) => void;

  /**
   * 主持人设置禁用麦克风通知事件
   *
   * 支持人调用 muteUserCamera 或着 muteAllUsersCamera 接口时，相关成员收到此通知事件。
   *
   * @param {boolean} mute - true: 主持人要求成员关闭摄像头，false: 主持人允许成员开启摄像头
   */
  onCameraMuted: (mute: boolean) => void;
}
