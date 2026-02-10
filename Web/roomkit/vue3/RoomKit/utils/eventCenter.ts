/**
 * 事件中心工具类
 * 提供事件的订阅、取消订阅和触发功能
 */

// 事件回调函数类型
export type EventCallback<T = any> = (data?: T) => void;

// 事件监听器信息
interface EventListener<T = any> {
  callback: EventCallback<T>;
  once: boolean;
  id: string;
}

// 事件中心类
export class EventCenter {
  // 存储所有事件监听器
  private listeners: Map<string, EventListener[]> = new Map();
  // 用于生成唯一的监听器ID
  private listenerIdCounter = 0;

  /**
   * 订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   * @returns 返回取消订阅的函数
   */
  on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.isValidEvent(event) || !this.isValidCallback(callback)) {
      throw new Error('Invalid event name or callback function');
    }

    const listenerId = this.generateListenerId();
    const listener: EventListener<T> = {
      callback,
      once: false,
      id: listenerId,
    };

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(listener);

    // 返回取消订阅函数
    return () => this.off(event, listenerId);
  }

  /**
   * 订阅事件（只触发一次）
   * @param event 事件名称
   * @param callback 回调函数
   * @returns 返回取消订阅的函数
   */
  once<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.isValidEvent(event) || !this.isValidCallback(callback)) {
      throw new Error('Invalid event name or callback function');
    }

    const listenerId = this.generateListenerId();
    const listener: EventListener<T> = {
      callback,
      once: true,
      id: listenerId,
    };

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(listener);

    // 返回取消订阅函数
    return () => this.off(event, listenerId);
  }

  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param callbackOrId 回调函数或监听器ID
   */
  off(event: string, callbackOrId?: EventCallback | string): void {
    if (!this.isValidEvent(event)) {
      return;
    }

    const listeners = this.listeners.get(event);
    if (!listeners) {
      return;
    }

    // 如果没有提供回调函数或ID，则移除该事件的所有监听器
    if (callbackOrId === undefined) {
      this.listeners.delete(event);
      return;
    }

    // 根据类型判断是回调函数还是ID
    const isId = typeof callbackOrId === 'string';
    const filteredListeners = listeners.filter(listener => {
      if (isId) {
        return listener.id !== callbackOrId;
      } else {
        return listener.callback !== callbackOrId;
      }
    });

    if (filteredListeners.length === 0) {
      this.listeners.delete(event);
    } else {
      this.listeners.set(event, filteredListeners);
    }
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param data 传递给回调函数的数据
   */
  emit<T = any>(event: string, data?: T): void {
    if (!this.isValidEvent(event)) {
      return;
    }

    const listeners = this.listeners.get(event);
    if (!listeners || listeners.length === 0) {
      return;
    }

    // 创建监听器副本，避免在执行过程中修改原数组
    const listenersToExecute = [...listeners];
    const onceListeners: string[] = [];

    // 执行所有监听器
    listenersToExecute.forEach(listener => {
      try {
        listener.callback(data);

        // 记录需要移除的一次性监听器
        if (listener.once) {
          onceListeners.push(listener.id);
        }
      } catch (error) {
        console.error(`Error executing event listener for "${event}":`, error);
      }
    });

    // 移除一次性监听器
    if (onceListeners.length > 0) {
      onceListeners.forEach(id => this.off(event, id));
    }
  }

  /**
   * 获取指定事件的监听器数量
   * @param event 事件名称
   * @returns 监听器数量
   */
  getListenerCount(event?: string): number {
    if (event) {
      const listeners = this.listeners.get(event);
      return listeners ? listeners.length : 0;
    }

    // 如果没有指定事件，返回所有监听器的总数
    let totalCount = 0;
    for (const listeners of this.listeners.values()) {
      totalCount += listeners.length;
    }
    return totalCount;
  }

  /**
   * 获取所有已注册的事件名称
   * @returns 事件名称数组
   */
  getEventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * 检查是否有指定事件的监听器
   * @param event 事件名称
   * @returns 是否有监听器
   */
  hasListeners(event: string): boolean {
    return this.getListenerCount(event) > 0;
  }

  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * 清除指定事件的所有监听器
   * @param event 事件名称
   */
  clearEvent(event: string): void {
    if (this.isValidEvent(event)) {
      this.listeners.delete(event);
    }
  }

  /**
   * 生成唯一的监听器ID
   * @returns 监听器ID
   */
  private generateListenerId(): string {
    return `listener_${++this.listenerIdCounter}_${Date.now()}`;
  }

  /**
   * 验证事件名称是否有效
   * @param event 事件名称
   * @returns 是否有效
   */
  private isValidEvent(event: string): boolean {
    return typeof event === 'string' && event.trim().length > 0;
  }

  /**
   * 验证回调函数是否有效
   * @param callback 回调函数
   * @returns 是否有效
   */
  private isValidCallback(callback: EventCallback): boolean {
    return typeof callback === 'function';
  }
}

// 创建默认的全局事件中心实例
export const eventCenter = new EventCenter();

// 导出便捷方法
export const on = eventCenter.on.bind(eventCenter);
export const once = eventCenter.once.bind(eventCenter);
export const off = eventCenter.off.bind(eventCenter);
export const emit = eventCenter.emit.bind(eventCenter);
export const clear = eventCenter.clear.bind(eventCenter);
export const getListenerCount = eventCenter.getListenerCount.bind(eventCenter);
export const getEventNames = eventCenter.getEventNames.bind(eventCenter);
export const hasListeners = eventCenter.hasListeners.bind(eventCenter);

export default eventCenter;
