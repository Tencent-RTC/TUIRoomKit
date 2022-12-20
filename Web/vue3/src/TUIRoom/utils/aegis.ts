/**
 * 需要配置 isUploadLoaded, aegisId, projectName
 * isUploadLoaded: 上传 loaded 事件
 * isUploadDetailEvent: 上传 loaded 及其他操作事件
 * aegisId: aegis Id
 * projectName: 项目名称
 */
const IS_LOCAL = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const IS_OFFICIAL_DEMO = location.host === 'web.sdk.qcloud.com';

const isUploadLoaded = IS_LOCAL || IS_OFFICIAL_DEMO;

const isUploadDetailEvent = IS_OFFICIAL_DEMO;

const aegisId = 'iHWefAYqCFrCVqqyIZ';

const projectName = 'TUIRoomKit-Web';


let aegis: any;

const script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://cdn-go.cn/aegis/aegis-sdk/latest/aegis.min.js';
document.getElementsByTagName('head')[0].appendChild(script);

script.onload = () => {
  // eslint-disable-next-line no-undef
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
};

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

export default roomAegis;
