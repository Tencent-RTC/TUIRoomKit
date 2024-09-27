import { IRoomService } from '../types';

export class ChatManager {
  static instance?: ChatManager;
  private service: IRoomService;

  constructor(service: IRoomService) {
    this.service = service;
  }

  static getInstance(ctx: IRoomService): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager(ctx);
    }
    return ChatManager.instance;
  }

  static destroyInstance(): void {
    if (!ChatManager.instance) return;
    ChatManager.instance = undefined;
  }

  public dispose(): void {}

  public setTUIChatFeatures(): void {}

  public reset(): void {}

  public async onNotifyEvent(): Promise<void> {}

  private onLanguageChanged(): void {}

  private onThemeChanged(): void {}

  private onUserNameCardChanged(): void {}

  private bindEventContext(): void {}

  private bindEvent(): void {}

  private unbindEvent(): void {}
}
