import { TRTCDeviceInfo, TRTCDeviceType, TRTCDeviceState } from './common/trtc_define';
import { BaseCommon } from './BaseCommon';
import { MixinsClass } from './utils/utils';
import { NAME } from './common/constants';

/**
 * 音频设备相关接口<br>
 * @memberof TRTCClouds
 */
class Mic extends MixinsClass(BaseCommon) {
  /**
   * 获取麦克风设备列表<br>
   * @returns {Promise(Array<TRTCDeviceInfo>)} 麦克风管理器列表
   * @memberof TRTCCloud
   * @example
   *   var micList = await trtcCloud.getMicDevicesList();
   *   for (i = 0; i < micList.length; i++) {
   *     var mic = micList[i];
   *     console.info("mic deviceName: " + mic.deviceName + " deviceId:" + mic.deviceId);
   *   }
   */
  async getMicDevicesList(): Promise<TRTCDeviceInfo[]> {
    try {
      const micList = await this.TRTC.getMicrophones();
      this.micList = micList.map((item: TRTCDeviceInfo) => ({
        ...item,
        deviceName: item.label, // 就是 deviceName
      }));
      return Promise.resolve(this.micList);
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'getMicDevicesList');
      return Promise.resolve([]);
    }
  }

  /**
   * 获取当前选择的麦克风<br>
   * @memberof TRTCCloud
   * @return {TRTCDeviceInfo} 设备信息，能获取设备 ID 和设备名称
   */
  getCurrentMicDevice(): TRTCDeviceInfo {
    if (this.currentMicId) {
      return (this.micList || []).filter((obj: any) => obj.deviceId === this.currentMicId)[0] || {};
    }
    return new TRTCDeviceInfo();
  }

  /**
   * 设置要使用的麦克风<br>
   * 选择指定的麦克风作为录音设备，不调用该接口时，默认选择索引为0的麦克风
   *
   * @param {String} micId - 从 getMicDevicesList 中得到的设备 ID
   * @memberof TRTCCloud
   * @returns {Promise}
   */
  async setCurrentMicDevice(micId: string): Promise<boolean> {
    try {
      if (!micId) {
        return Promise.resolve(false);
      }
      if (!this.localStream) {
        return Promise.resolve(true);
      }
      if (this.localStream && this.currentMicId !== micId) {
        await this.localStream.switchDevice(NAME.AUDIO, micId);
        this.currentMicId = micId || '';
        this.emitOnDeviceChange(micId, TRTCDeviceType.TRTCDeviceTypeMic, TRTCDeviceState.TRTCDeviceStateActive);
        return Promise.resolve(true);
      }
      return Promise.resolve(true);
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'setCurrentMicDevice');
      return Promise.resolve(false);
    }
  }

  /**
   * 获取扬声器设备列表<br>
   * - 出于安全的考虑，在用户未授权摄像头或麦克风访问权限前，deviceId 字段可能都是空的。因此建议在用户授权访问后 再调用该接口获取设备详情
   * - 移动端不支持获取扬声器列表
   * @return {Promise(Array<TRTCDeviceInfo>)} 扬声器管理器列表
   * @memberof TRTCCloud
   * @example
   *   var speakerList = await trtcCloud.getSpeakerDevicesList();
   *   for (i = 0; i < speakerList.length; i++) {
   *     var speaker = speakerList[i];
   *     console.info("mic deviceName: " + speaker.deviceName + " deviceId:" + speaker.deviceId);
   *   }
   */
  async getSpeakerDevicesList(): Promise<TRTCDeviceInfo[]> {
    try {
      const speakerList = await this.TRTC.getSpeakers();
      this.speakerList = speakerList.map((item: TRTCDeviceInfo) => ({
        ...item,
        deviceName: item.label, // 就是 deviceName
      }));
      return Promise.resolve(this.speakerList);
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'getSpeakerDevicesList');
      return Promise.resolve([]);
    }
  }

  /**
   * 获取当前的扬声器设备<br>
   * @memberof TRTCCloud
   * @return {TRTCDeviceInfo} 设备信息，能获取设备 ID 和设备名称
   */
  getCurrentSpeakerDevice(): TRTCDeviceInfo {
    if (this.currentSpeakerId) {
      return (this.speakerList || []).filter((obj: any) => obj.deviceId === this.currentSpeakerId)[0] || {};
    }
    return new TRTCDeviceInfo();
  }

  /**
   * 设置要使用的扬声器<br>
   * - 移动端不支持设置扬声器。
   * @param {String} speakerId - 从 getSpeakerDevicesList 中得到的设备 ID
   * @returns {Promise}
   * @memberof TRTCCloud
   */
  async setCurrentSpeakerDevice(speakerId: string): Promise<boolean> {
    try {
      if (!speakerId) {
        return Promise.resolve(false);
      }
      this.currentSpeakerId = speakerId || '';
      if (this.remoteStreamMap.size > 0) {
        const remoteStreamList = this.getRemoteStreamList();
        // TODO: 如果某个 remoteStream 出现切换失败呢？
        // eslint-disable-next-line max-len
        await Promise.all(remoteStreamList.map(async (stream: any) => await stream.setAudioOutput(this.currentSpeakerId)));
        return Promise.resolve(true);
      }
      return Promise.resolve(true);
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'setCurrentSpeakerDevice');
      return Promise.resolve(false);
    }
  }
}

export { Mic };
