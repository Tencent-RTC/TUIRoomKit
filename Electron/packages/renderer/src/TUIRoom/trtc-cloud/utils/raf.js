/* eslint-disable no-underscore-dangle */
import generateUUID from './uuid';
import { performanceNow } from './utils';

/**
 * 基于 requestAnimationFrame 实现类 setInterval  的功能
 * @class RAF
 */
class RAF {
  constructor() {
    // Map<intervalId, { rafId, timeoutId, onVisibilityChange}>
    // rafId: requestAnimationFrame 返回的 id
    // timeoutId: setTimeout 返回的 id。在页面隐藏时，使用 setTimeout 作为 requestAnimationFrame 的 backup
    // onVisibilityChange: 监听页面可视性变更的回调，保存该回调是用于在结束 interval 时注销监听。
    this.intervalMap_ = new Map();
  }

  /**
   * 基于 requestAnimationFrame 实现类 setInterval  的功能
   * 当页面隐藏时，会用 setTimeout 作为 backup
   * @param {function} fn
   * @param {number} interval 时间间隔
   * @param {boolean} [enableInBackground=true] 当页面切换到后台时，是否执行 interval
   * @return {string} intervalId
   * @memberof RAF
   */
  setInterval(fn, interval, enableInBackground = true) {
    const intervalId = generateUUID();
    let startTime = performanceNow();
    let endTime = startTime;

    this.intervalMap_.set(intervalId, {
      rafId: null,
      timeoutId: null,
      onVisibilityChange: null,
    });

    const rafLoop = () => {
      // 当页面隐藏时，用 setTimeout 作为 backup
      if (enableInBackground && document.hidden) {
        fn();
        const timeoutId = setTimeout(rafLoop, interval);
        this.setTimeoutId(intervalId, timeoutId);
        startTime = performanceNow();
        endTime = startTime;
      } else {
        endTime = performanceNow();
        if (endTime - startTime >= interval) {
          startTime = endTime;
          fn();
        }
        const rafId = requestAnimationFrame(rafLoop);

        this.setRafId(intervalId, rafId);
      }
    };
    const rafId = requestAnimationFrame(rafLoop);
    this.setRafId(intervalId, rafId);

    // 当页面隐藏时，用 setTimeout 作为 backup
    if (enableInBackground) {
      const onVisibilityChange = () => {
        if (document.hidden) {
          const span = performanceNow() - startTime;
          // 页面隐藏时，距离上次回调执行完的间隔超过 interval，则立即执行 rafLoop
          if (span >= interval) {
            rafLoop();
          } else {
            // 页面隐藏时，未达 interval，则在 interval - span 后执行 rafLoop
            const timeoutId = setTimeout(rafLoop, interval - span);
            this.setTimeoutId(intervalId, timeoutId);
          }
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      this.setOnVisibilityChange(intervalId, onVisibilityChange);
    }

    return intervalId;
  }

  /**
   * 清除 interval
   * @param {string} intervalId
   * @memberof RAF
   */
  clearInterval(intervalId) {
    if (this.intervalMap_.has(intervalId)) {
      const { rafId, timeoutId, onVisibilityChange } = this.intervalMap_.get(intervalId);
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      this.intervalMap_.delete(intervalId);
    }
  }

  setTimeoutId(intervalId, timeoutId) {
    if (this.intervalMap_.has(intervalId)) {
      const value = this.intervalMap_.get(intervalId);
      // 在设置新的 timeout 之前，需清理先前的 timeout
      // 避免来回切换 tab 时，重复设置
      if (value.timeoutId) {
        clearTimeout(value.timeoutId);
      }
      value.timeoutId = timeoutId;
    }
  }

  setRafId(intervalId, rafId) {
    if (this.intervalMap_.has(intervalId)) {
      const value = this.intervalMap_.get(intervalId);
      // 在设置新的 requestAnimationFrame 之前，需清理先前设置的 raf
      // 避免来回切换 tab 时，重复设置
      if (value.rafId) {
        cancelAnimationFrame(value.rafId);
      }
      value.rafId = rafId;
    }
  }

  setOnVisibilityChange(intervalId, onVisibilityChange) {
    if (this.intervalMap_.has(intervalId)) {
      const value = this.intervalMap_.get(intervalId);
      value.onVisibilityChange = onVisibilityChange;
    }
  }
}

const raf = new RAF();

export default raf;
