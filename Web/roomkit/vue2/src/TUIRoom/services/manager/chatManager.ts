import { TUIConstants, TUICore } from '@tencentcloud/tui-core';
import { EventType, IRoomService } from '../types';
import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import { UserInfo } from '../../stores/room';
import defaultAvatar from '../../assets/imgs/avatar.png';

const THEME = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
};

export class ChatManager {
  static instance?: ChatManager;
  private service: IRoomService;
  private isRoomType = false;

  constructor(service: IRoomService) {
    this.service = service;
    this.bindEventContext();
    this.bindEvent();
    TUICore.registerEvent(
      TUIConstants.TUIChat.EVENT.CHAT_STATE_CHANGED,
      TUIConstants.TUIChat.EVENT_SUB_KEY.CHAT_OPENED,
      this
    );
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

  public dispose() {
    this.unbindEvent();
  }

  public reset() {
    TUICore.unregisterExtension(
      TUIConstants.TUIChat.EVENT.CHAT_STATE_CHANGED,
      this
    );
  }

  public setChatType(type: boolean) {
    this.isRoomType = type;
  }

  public async onNotifyEvent(eventName: string, subKey: string, options?: any) {
    if (!this.isRoomType) return;
    if (eventName === TUIConstants.TUIChat.EVENT.CHAT_STATE_CHANGED) {
      if (subKey === TUIConstants.TUIChat.EVENT_SUB_KEY.CHAT_OPENED) {
        TUICore.callService({
          serviceName: TUIConstants.TUIChat.SERVICE.NAME,
          method: TUIConstants.TUIChat.SERVICE.METHOD.SET_CHAT_TYPE,
          params: {
            chatType: TUIConstants.TUIChat.TYPE.ROOM,
          },
        });
        const result = Object.fromEntries(
          this.service.roomStore.userList.map(item => [
            item.userId,
            {
              nick: item.userName,
              nameCard: item.nameCard,
              avatar: item.avatarUrl || defaultAvatar,
            },
          ])
        );
        TUICore.callService({
          serviceName: TUIConstants.TUIChat.SERVICE.NAME,
          method: TUIConstants.TUIChat.SERVICE.METHOD.UPDATE_MESSAGE_INFO,
          params: { userInfo: result },
        });
      }
    }
  }

  private onLanguageChanged(language: string) {
    TUICore.notifyEvent(
      TUIConstants.TUITranslate.EVENT.LANGUAGE_CHANGED,
      TUIConstants.TUITranslate.EVENT_SUB_KEY.CHANGE_SUCCESS,
      { language }
    );
  }

  private onThemeChanged(theme: string) {
    const currentTheme = theme === 'black' ? THEME.DARK : THEME.LIGHT;
    TUICore.notifyEvent(
      TUIConstants.TUITheme.EVENT.THEME_CHANGED,
      TUIConstants.TUITheme.EVENT_SUB_KEY.CHANGE_SUCCESS,
      { theme: currentTheme }
    );
  }

  private onUserNameCardChanged(eventInfo: { userInfo: UserInfo }) {
    const { userId, nameCard } = eventInfo.userInfo;
    const result = { [userId]: { nameCard } };

    TUICore.callService({
      serviceName: TUIConstants.TUIChat.SERVICE.NAME,
      method: TUIConstants.TUIChat.SERVICE.METHOD.UPDATE_MESSAGE_INFO,
      params: { userInfo: result },
    });
  }

  private bindEventContext() {
    this.onLanguageChanged = this.onLanguageChanged.bind(this);
    this.onThemeChanged = this.onThemeChanged.bind(this);
    this.onUserNameCardChanged = this.onUserNameCardChanged.bind(this);
  }

  private bindEvent() {
    this.service.on(EventType.LANGUAGE_CHANGED, this.onLanguageChanged);
    this.service.on(EventType.THEME_CHANGED, this.onThemeChanged);
    TUIRoomEngine.once('ready', () => {
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onUserInfoChanged,
        this.onUserNameCardChanged
      );
    });
  }

  private unbindEvent() {
    this.service.off(EventType.LANGUAGE_CHANGED, this.onLanguageChanged);
    this.service.off(EventType.THEME_CHANGED, this.onThemeChanged);
    this.service.roomEngine.instance?.off(
      TUIRoomEvents.onUserInfoChanged,
      this.onUserNameCardChanged
    );
  }
}
