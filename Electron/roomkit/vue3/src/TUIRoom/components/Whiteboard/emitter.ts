import mitt, { Emitter, EventType, Handler } from 'mitt';

class EventEmitter<T extends Record<EventType, unknown>> {
  private emitter: Emitter<T>;

  constructor() {
    this.emitter = mitt();
  }

  on(eventName: keyof T, handler: Handler<T[keyof T]>) {
    this.emitter.on(eventName, handler);
  }

  off(eventName: keyof T, handler: Handler<T[keyof T]>) {
    this.emitter.off(eventName, handler);
  }

  emit(eventName: keyof T, event: T[keyof T]) {
    this.emitter.emit(eventName, event);
  }

  removeAllListeners() {
    this.emitter.all.clear();
  }
}

export default EventEmitter;
