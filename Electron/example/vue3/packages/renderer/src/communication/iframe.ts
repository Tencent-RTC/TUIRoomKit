import mitt from 'mitt';
export default class IframeCommunication {
  private isParent: boolean;
  private targetWindow: any;
  private from: string;
  private to: string;
  private emitter: any;

  constructor(params: {
    isParent: boolean;
    targetWindow: any;
    from: string;
    to: string;
  }) {
    this.isParent = params.isParent;
    this.targetWindow = params.targetWindow;
    this.from = params.from;
    this.to = params.to;
    this.emitter = mitt();
    this.receiveMessage = this.receiveMessage.bind(this);

    this.initEvents();
  }

  sendMessage(cmd: string, params: object) {
    const sendMsg = {
      cmd,
      from: this.from,
      to: this.to,
      params,
    };
    if (this.targetWindow) {
      this.targetWindow.postMessage(JSON.stringify(sendMsg), '*');
    }
  }

  initEvents() {
    window.addEventListener('message', this.receiveMessage);
  }

  receiveMessage(event: MessageEvent) {
    try {
      const info = JSON.parse(event.data);
      if (info.from && info.to) {
        this.emitter.emit(info.cmd, info);
      }
    } catch (e) {
    }
  }

  on(eventName: string, func: any) {
    this.emitter.on(eventName, func);
  }

  destroy() {
    window.removeEventListener('message', this.receiveMessage);
  }
}
