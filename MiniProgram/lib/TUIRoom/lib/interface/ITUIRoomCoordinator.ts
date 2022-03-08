/**
 * Room统一接口
 *
 * 接口设计原则：
 *  （1）主动调用且需要处理异步响应的，定义为异步的 Promise 接口，
 * 如：进房接口（这一点与 TRTC 接口不同，TRTC 主动调用需要等待异步响应的接口，
 * 都是通过事件处理的异步响应）
 *  （2）需要被动触发的接口，通过事件接口实现，如：远端用户进房事件接口
 */
import TUIRoomResponse from '../base/TUIRoomResponse';

export default interface TRoomCoordinator {
  /**
   * 主持人开启或关闭成员麦克风
   *
   * @param {string} userID 成员ID
   * @param {boolean} mute true: 关闭，false: 开启
   * @returns {Promise}
   */
  muteUserMicrophone: (
    userID: string,
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
   * @param {string} userID 成员ID
   * @param {boolean} mute true: 关闭，false: 开启
   * @returns {Promise}
   */
  muteUserCamera: (
    userID: string,
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
   * 主持人踢人
   *
   * @param {string} userID 成员ID
   * @returns {Promise}
   */
  kickOffUser: (userID: string) => Promise<TUIRoomResponse<any>>; // 1v1 信令，不直接用群踢人接口，因为不可靠


}
