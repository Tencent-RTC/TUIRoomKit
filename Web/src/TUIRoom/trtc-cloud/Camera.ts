import { TRTCDeviceInfo } from './common/trtc_define';
import { BaseCommon } from './BaseCommon';
import { MixinsClass } from './utils/utils';

// eslint-disable-next-line new-cap
class Camera extends MixinsClass(BaseCommon) {
  // ///////////////////////////////////////////////////////////////////////////////
  //
  //                      （五）摄像头相关接口函数
  //
  // ///////////////////////////////////////////////////////////////////////////////
  /**
   * 5.1 获取摄像头设备列表
   *
   * @example
   * var cameralist = this.rtcCloud.getCameraDevicesList();
   * for (i=0;i<cameralist.length;i++) {
   *    var camera = cameralist[i];
   *    console.info("camera deviceName: " + camera.deviceName + " deviceId:" + camera.deviceId);
   * }
   * @return {TRTCDeviceInfo[]} 摄像头管理器列表 Attention: return Promise
   */
  async getCameraDevicesList(): Promise<TRTCDeviceInfo[]> {
    try {
      const cameraList = await this.TRTC.getCameras();
      this.cameraList = cameraList.map((item: { deviceId: string; label: string; }) => ({
        deviceId: item.deviceId,
        deviceName: item.label,
      }));
      return Promise.resolve(this.cameraList);
    } catch (error) {
      this.callFunctionErrorManage(error, 'getCameraDevicesList');
      this.cameraList = [];
      return Promise.resolve([]);
    }
  }

  /**
   * 5.2 设置要使用的摄像头
   *
   * @param {String} deviceId - 从 getCameraDevicesList 中得到的设备 ID
   * Attention: return Promise, https://web.sdk.qcloud.com/trtc/webrtc/doc/zh-cn/LocalStream.html#switchDevice
   */
  async setCurrentCameraDevice(deviceId: string): Promise<boolean> {
    try {
      if (!deviceId) {
        return Promise.resolve(false);
      }
      this.currentCameraId = deviceId || '';
      if (this.localStream) {
        await this.localStream.switchDevice('video', deviceId);
      }
      if (this.testCameraStream) {
        await this.testCameraStream.switchDevice('video', deviceId);
      }
      return Promise.resolve(true);
    } catch (error) {
      this.callFunctionErrorManage(error, 'setCurrentCameraDevice');
      this.cameraList = [];
      return Promise.resolve(false);
    }
  }

  /**
   * 5.3 获取当前使用的摄像头
   *
   * @return {TRTCDeviceInfo} 设备信息，能获取设备 ID 和设备名称
   */
  getCurrentCameraDevice(): TRTCDeviceInfo {
    return (this.cameraList || []).filter((obj: any) => obj.deviceId === this.currentCameraId)[0] || {};
  }
}

export { Camera };
