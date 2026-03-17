import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import type { MetricsKey } from './MetricsKey';

const KEY_METRICS_API = 'KeyMetricsStats';

type Task = () => void | Promise<void>;

export class DataReport {
  private taskQueue: Task[] = [];
  private isReady = false;

  constructor() {
    this.bindEvent();
  }

  public reportCount(key: MetricsKey) {
    try {
      const task = this.createReportCountTask(key);
      if (!this.isReady) {
        this.taskQueue.push(task);
      } else {
        task();
      }
    } catch (error) {
      console.warn('Report count failed:', error);
    }
  }

  private bindEvent() {
    TUIRoomEngine.once('ready', () => {
      this.isReady = true;
      this.executePendingTasks();
    });
  }

  private executePendingTasks() {
    this.taskQueue.forEach((task) => {
      try {
        task();
      } catch (error) {
        console.warn('Task execution failed:', error);
      }
    });
    this.taskQueue = [];
  }

  private createReportCountTask(key: MetricsKey): Task {
    return () => {
      TUIRoomEngine.callExperimentalAPI(
        JSON.stringify({
          api: KEY_METRICS_API,
          params: { key },
        }),
      );
    };
  }
}

export const dataReport = new DataReport();
