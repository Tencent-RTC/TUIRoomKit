import { TUIRoomEngine } from '@tencentcloud/tuiroom-engine-wx';
import packageConfig from '../../../../../package.json';
const appVersion = packageConfig.version;
const KEY_METRICS_API = 'KeyMetricsStats';

export enum MetricsKey {
  startSharingWhiteboard = 106000,
  stopSharingWhiteboard = 106001,
  startAnnotating = 106002,
  stopAnnotating = 106003,
  saveWhiteboard = 106004,
}

export class DataReportManager {
  static reportCount(key: MetricsKey) {
    TUIRoomEngine.callExperimentalAPI(
      JSON.stringify({
        api: KEY_METRICS_API,
        params: {
          opt: 'count',
          key,
          version: appVersion,
        },
      })
    );
  }
}
