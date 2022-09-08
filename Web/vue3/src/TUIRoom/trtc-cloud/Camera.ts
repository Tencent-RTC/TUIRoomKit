import { TRTCDeviceInfo, TRTCDeviceType, TRTCDeviceState } from './common/trtc_define';
import { BaseCommon } from './BaseCommon';
import { MixinsClass } from './utils/utils';
import { NAME } from './common/constants';

/**
 * 摄像头相关接口<br>
 * @memberof TRTCClouds
 */
class Camera extends MixinsClass(BaseCommon) {
  /**
   * 获取摄像头设备列表<br>
   * @returns {Promise(Array<TRTCDeviceInfo>)} 摄像头管理器列表
   * @memberof TRTCCloud
   * @example
   * var cameralist = await trtcCloud.getCameraDevicesList();
   * for (i = 0; i < cameralist.length; i++) {
   *    var camera = cameralist[i];
   *    console.info("camera deviceName: " + camera.deviceName + " deviceId:" + camera.deviceId);
   * }
   */
  async getCameraDevicesList(): Promise<TRTCDeviceInfo[]> {
    try {
      const cameraList = await this.TRTC.getCameras();
      this.cameraList = cameraList.map((item: TRTCDeviceInfo) => ({
        ...item,
        deviceName: item.label, // 就是 deviceName
      }));
      return Promise.resolve(this.cameraList);
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'getCameraDevicesList');
      this.cameraList = [];
      return Promise.resolve([]);
    }
  }

  /**
   * 设置要使用的摄像头<br>
   * @param {String} deviceId - 从 getCameraDevicesList 中得到的设备 ID
   * @returns {Promise}
   * @memberof TRTCCloud
   */
  async setCurrentCameraDevice(deviceId: string): Promise<boolean> {
    try {
      if (!deviceId) {
        return Promise.resolve(false);
      }
      this.currentCameraId = deviceId || '';
      if (this.localStream) {
        await this.localStream.switchDevice(NAME.VIDEO, deviceId);
        this.emitOnDeviceChange(deviceId, TRTCDeviceType.TRTCDeviceTypeCamera, TRTCDeviceState.TRTCDeviceStateActive);
      }
      if (this.testCameraStream) {
        await this.testCameraStream.switchDevice('video', deviceId);
      }
      return Promise.resolve(true);
    } catch (error: any) {
      this.callFunctionErrorManage(error, 'setCurrentCameraDevice');
      this.cameraList = [];
      return Promise.resolve(false);
    }
  }

  /**
   * 获取当前使用的摄像头<br>
   * @memberof TRTCCloud
   * @returns {TRTCDeviceInfo} 设备信息，能获取设备 ID 和设备名称
   */
  getCurrentCameraDevice(): TRTCDeviceInfo {
    return (this.cameraList || []).filter((obj: any) => obj.deviceId === this.currentCameraId)[0] || {};
  }
}

export { Camera };
