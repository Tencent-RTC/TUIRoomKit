/**
 * 需要配置 isUploadLoaded, aegisId, projectName
 * isUploadLoaded: 上传 loaded 事件
 * isUploadDetailEvent: 上传 loaded 及其他操作事件
 * aegisId: aegis Id
 * projectName: 项目名称
 */

const { VITE_RUNTIME_ENV } = import.meta.env;
const isUploadLoaded = ['github', 'official'].indexOf(VITE_RUNTIME_ENV) !== -1;
const isUploadDetailEvent = VITE_RUNTIME_ENV === 'official';

let aegis: any;
const aegisId = 'iHWefAYqooXkVQhcyK';
const projectName = 'TUIRoomKit-Electron';

class TUIRoomAegis {
  private sdkAppId: number = 0;
  private projectName: string = projectName;
  private isUploadLoaded: boolean = isUploadLoaded;
  private isUploadDetailEvent: boolean = isUploadDetailEvent;
  private hasUploadedEventList: Array<string> = [];

  storedReportEventList: Array<any> = [];

  setSdkAppId(sdkAppId: number) {
    this.sdkAppId = sdkAppId;
  }

  reportEvent(data: { name: string, ext1: string }) {
    if (!this.isUploadLoaded) {
      return;
    }
    const { name: eventName, ext1: eventDesc } = data;
    if (this.isUploadDetailEvent || eventName === 'loaded') {
      const uploadData = { ...data, ext2: this.projectName, ext3: this.sdkAppId };
      if (aegis) {
        if (this.hasUploadedEventList.indexOf(`${eventName}_${eventDesc}`) < 0) {
          this.hasUploadedEventList.push(`${eventName}_${eventDesc}`);
          aegis.reportEvent(uploadData);
        }
      } else {
        this.storedReportEventList.push(uploadData);
      }
    }
  }
}

const roomAegis = new TUIRoomAegis();
aegis = new Aegis({
  id: aegisId,
  uin: '',
  reportApiSpeed: true, // 接口测速
  reportAssetSpeed: true, // 静态资源测速
  spa: true, // spa 页面开启
});
if (roomAegis.storedReportEventList) {
  roomAegis.storedReportEventList.forEach((data) => {
    aegis.reportEvent(data);
  });
}

export default roomAegis;
