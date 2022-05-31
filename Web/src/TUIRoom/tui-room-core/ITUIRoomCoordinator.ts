/**
 * Room统一接口
 *
 * 接口设计原则：
 *  （1）主动调用且需要处理异步响应的，定义为异步的 Promise 接口，
 * 如：进房接口（这一点与 TRTC 接口不同，TRTC 主动调用需要等待异步响应的接口，
 * 都是通过事件处理的异步响应）
 *  （2）需要被动触发的接口，通过事件接口实现，如：远端用户进房事件接口
 */
import TUIRoomResponse from './base/TUIRoomResponse';

export default interface TRoomCoordinator {
  /**
   * 主持人开启或关闭成员麦克风
   *
   * @param {string} userId 成员Id
   * @param {boolean} mute true: 关闭，false: 开启
   * @returns {Promise}
   */
  muteUserMicrophone: (
    userId: string,
    mute: boolean
  ) => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人开启或关闭全体成员的麦克风
   *
   * @param {boolean} mute true: 关闭，false: 开启
   * @returns {Promise}
   */
  muteAllUsersMicrophone: (mute: boolean) => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人开启或关闭成员摄像头
   *
   * @param {string} userId 成员Id
   * @param {boolean} mute true: 关闭，false: 开启
   * @returns {Promise}
   */
  muteUserCamera: (
    userId: string,
    mute: boolean
  ) => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人开启或关闭全体成员摄像头
   *
   * @param {boolean} mute true: 关闭，false: 开启
   * @returns {Promise}
   */
  muteAllUsersCamera: (mute: boolean) => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人开启或关闭聊天功能
   *
   * @param {boolean} mute true: 关闭，false: 开启
   * @returns {Promise}
   */
  muteChatRoom: (mute: boolean) => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人踢人
   *
   * @param {string} userId 成员Id
   * @returns {Promise}
   */
  kickOffUser: (userId: string) => Promise<TUIRoomResponse<any>>; // 1v1 信令，不直接用群踢人接口，因为不可靠

  /**
   * 主持人开始定名
   *
   * @returns {Promise}
   */
  startCallingRoll: () => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人结束点名
   *
   * @returns {Promise}
   */
  stopCallingRoll: () => Promise<TUIRoomResponse<any>>;

  /**
   * 成员回复点名
   *
   * @return {Promise}
   */
  replyCallingRoll: () => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人邀请成员发言
   *
   * @param {string} userId 成员Id
   * @returns {Promise}
   */
  sendSpeechInvitation: (userId: string) => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人取消发言邀请
   *
   * @param {string} userId 成员Id
   * @returns {Promise}
   */
  cancelSpeechInvitation: (userId: string) => Promise<TUIRoomResponse<any>>;

  /**
   * 成员响应发言邀请
   *
   * @param {boolean} agree true: 接收邀请，false: 拒绝邀请
   */
  replySpeechInvitation: (agree: boolean) => Promise<TUIRoomResponse<any>>;

  /**
   * 成员申请发言
   *
   * @returns {Promise}
   */
  sendSpeechApplication: () => Promise<TUIRoomResponse<any>>;

  /**
   * 成员取消发言申请
   *
   * @returns {Promise}
   */
  cancelSpeechApplication: () => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人响应发言申请
   *
   * @param {string} userId 成员Id
   * @param {boolean} agree true: 同意，false: 拒绝。
   * @returns {Promise}
   */
  replySpeechApplication: (
    userId: string,
    agree: boolean
  ) => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人允许或禁止申请发言
   *
   * @param {boolean} forbid true: 禁止申请发言，false: 允许申请发言
   */
  forbidSpeechApplication: (forbid: boolean) => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人令成员停止发言
   *
   * @param {string} userId 成员Id
   * @returns {Promise}
   */
  sendOffSpeaker: (userId: string) => Promise<TUIRoomResponse<any>>;

  /**
   * 主持人令全体成员停止发言
   *
   * @returns {Promise}
   */
  sendOffAllSpeakers: () => Promise<TUIRoomResponse<any>>;

  /**
   * 成员停止发言,转变为观众
   *
   * 如果成员在发言，调用该接口，则停止发言。
   * @returns {Promise}
   */
  exitSpeechState: () => Promise<TUIRoomResponse<any>>;
}
