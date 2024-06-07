
import { isUploadLoaded, isUploadDetailEvent, aegisId, projectName } from './config';

let aegis: any;


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
