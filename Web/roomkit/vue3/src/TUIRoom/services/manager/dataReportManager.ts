import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';

const KEY_METRICS_API = 'KeyMetricsStats';

export enum MetricsKey {
  startSharingWhiteboard = 106000,
  stopSharingWhiteboard = 106001,
  startAnnotating = 106002,
  stopAnnotating = 106003,
  saveWhiteboard = 106004,

  setLanguage = 106050,
  setTheme = 106051,
  disableTextMessaging = 106052,
  disableScreenSharing = 106053,
  enableWatermark = 106054,
  enableVirtualBackground = 106055,
  hideFeatureButton = 106056,
}

type Task = () => void;

export class DataReportManager {
  private taskQueue: Task[] = [];
  private isReady = false;

  constructor() {
    this.bindEvent();
  }

  public reportCount(key: MetricsKey) {
    const task = this.createReportCountTask(key);
    if (!this.isReady) {
      this.taskQueue.push(task);
    } else {
      task();
    }
  }

  private bindEvent() {
    TUIRoomEngine.once('ready', () => {
      this.isReady = true;
      this.executePendingTasks();
    });
  }

  private executePendingTasks() {
    this.taskQueue.forEach(task => task());
    this.taskQueue = [];
  }

  private createReportCountTask(key: MetricsKey): Task {
    return () => {
      TUIRoomEngine.callExperimentalAPI(
        JSON.stringify({
          api: KEY_METRICS_API,
          params: { key },
        })
      );
    };
  }
}
