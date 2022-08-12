import { TRTCDeviceInfo } from './common/trtc_define';
import { BaseCommon } from './BaseCommon';
import { MixinsClass } from './utils/utils';

// eslint-disable-next-line new-cap
class Mic extends MixinsClass(BaseCommon) {
  // ///////////////////////////////////////////////////////////////////////////////
  //
  //                      （六）音频设备相关接口函数
  //
  // ///////////////////////////////////////////////////////////////////////////////
  /**
   * 6.1 获取麦克风设备列表
   *
   * @example
   *   var miclist = this.rtcCloud.getMicDevicesList();
   *   for (i=0;i<miclist.length;i++) {
   *     var mic = miclist[i];
   *     console.info("mic deviceName: " + mic.deviceName + " deviceId:" + mic.deviceId);
   *   }
   * @return {TRTCDeviceInfo[]} 麦克风管理器列表 Attention: return Promise
   */
  async getMicDevicesList(): Promise<TRTCDeviceInfo[]> {
    try {
      const micList = await this.TRTC.getMicrophones();
      this.micList = micList.map((item: { deviceId: string; label: string; }) => ({
        deviceId: item.deviceId,
        deviceName: item.label,
      }));
      return Promise.resolve(this.micList);
    } catch (error) {
      this.callFunctionErrorManage(error, 'getMicDevicesList');
      return Promise.resolve([]);
    }
  }

  /**
   * 6.2 获取当前选择的麦克风
   *
   * @return {TRTCDeviceInfo} 设备信息，能获取设备 ID 和设备名称
   */
  getCurrentMicDevice(): TRTCDeviceInfo {
    return (this.micList || []).filter((obj: any) => obj.deviceId === this.currentMicId)[0] || {};
  }

  /**
   * 6.3 设置要使用的麦克风
   *
   * 选择指定的麦克风作为录音设备，不调用该接口时，默认选择索引为0的麦克风
   *
   * @param {String} micId - 从 getMicDevicesList 中得到的设备 ID
   */
  async setCurrentMicDevice(micId: string): Promise<boolean> {
    try {
      if (!micId) {
        return Promise.resolve(false);
      }
      this.currentMicId = micId || '';
      if (!this.localStream) {
        return Promise.resolve(true);
      }
      if (this.localStream) {
        return await this.localStream.switchDevice('audio', micId);
      }
      return Promise.resolve(true);
    } catch (error) {
      this.callFunctionErrorManage(error, 'setCurrentMicDevice');
      return Promise.resolve(false);
    }
  }

  /**
   * 6.8 获取扬声器设备列表
   *
   * @example
   *   var speakerlist = this.rtcCloud.getSpeakerDevicesList();
   *   for (i=0;i<speakerlist.length;i++) {
   *     var speaker = speakerlist[i];
   *     console.info("mic deviceName: " + speaker.deviceName + " deviceId:" + speaker.deviceId);
   *   }
   * @return {TRTCDeviceInfo[]} 扬声器管理器列表
   */
  async getSpeakerDevicesList(): Promise<TRTCDeviceInfo[]> {
    try {
      const speakerList = await this.TRTC.getSpeakers();
      this.speakerList = speakerList.map((item: { deviceId: string; label: string; }) => ({
        deviceId: item.deviceId,
        deviceName: item.label,
      }));
      return Promise.resolve(this.speakerList);
    } catch (error) {
      this.callFunctionErrorManage(error, 'getSpeakerDevicesList');
      return Promise.resolve([]);
    }
  }

  /**
   * 6.9 获取当前的扬声器设备
   *
   * @return {TRTCDeviceInfo} 设备信息，能获取设备 ID 和设备名称
   */
  getCurrentSpeakerDevice(): TRTCDeviceInfo {
    return this.speakerList[0] || {};
    // return (this.speakerList || []).filter((obj: any) => obj.deviceId === this.currentSpeakerId)[0] || {};
  }

  /**
   * 6.10 设置要使用的扬声器
   *
   * @param {String} speakerId - 从 getSpeakerDevicesList 中得到的设备 ID
   */
  async setCurrentSpeakerDevice(speakerId: string): Promise<boolean> {
    try {
      if (!speakerId) {
        return Promise.resolve(false);
      }
      this.currentSpeakerId = speakerId || '';
      if (!this.localStream) {
        return Promise.resolve(false);
      }
      return await this.localStream.setAudioOutput(speakerId);
    } catch (error) {
      this.callFunctionErrorManage(error, 'setCurrentSpeakerDevice');
      return Promise.resolve(false);
    }
  }
}

export { Mic };
