import {
  ExtensionInfo,
  TUIConstants,
  TUICore,
  TUILogin,
} from '@tencentcloud/tui-core';
import TUIRoomEngine, {
  TUIErrorCode,
  TUIRole,
  TUIRoomEvents,
  TUIUserInfo,
} from '@tencentcloud/tuiroom-engine-js';
import {
  EventType,
  roomEngine,
  RoomParam,
  roomService,
  RoomService,
  JoinParams,
  StartParams,
} from '../services';
import { setDragAndResize } from './utils/interact';
import { Conversation, Message, Profile } from '@tencentcloud/chat';
import { isMobile } from '../utils/environment';
import { setLanguage } from './utils/setLanguage';
import { VueVersion } from './utils/common';
import { parseMessageData } from './utils/judgeRoomMessage';
const defaultAvatarUrl =
  'https://qcloudimg.tencent-cloud.cn/raw/6a075bead54faca9ca378f4d89c62fae.png';

export interface MessageData {
  ID?: string;
  isInnerRoom: boolean;
  isRoomMessage: boolean;
  isRoomCreateByMe: boolean;
  isMessageFromMe: boolean;
  roomId: string;
  roomState: RoomState;
  userList: Array<{ faceUrl: string; nickName: string; userId: string }>;
  myProfile: Profile;
  ownerName: string;
  owner: string;
}
const getRoomOptions = () =>
  ({
    roomId: String(Math.ceil(Math.random() * 1000000)),
    roomMode: 'FreeToSpeak',
    roomParam: {
      isOpenCamera: true,
      isOpenMicrophone: true,
    },
  }) as {
    roomId: string;
    roomName?: string;
    roomMode: 'FreeToSpeak' | 'SpeakAfterTakingSeat';
    roomParam?: RoomParam;
  };
export interface CustomMessagePayload {
  version: number;
  businessID: string; // Fixed value, used to distinguish the type of custom message on IM.
  groupId: string; // When inviting group members to join, groupId is needed to get the list of group members.
  messageId: string; // Used to find and update a specific message after the audience becomes the host.
  roomId: string; // The id of the room, a required parameter for enterRoom.
  owner: string; // The userId of the room owner.
  ownerName: string; // The userName of the room owner.
  roomState: RoomState; // The current room state, there are four states: creating/created/destroying/destroyed.
  memberCount: 1; // The number of people in the current room, it needs to be displayed on the UI how many people are in the meeting.
  userList: Array<{ faceUrl: string; nickName: string; userId: string }>; // The list of invited users including the room owner, display up to 5 to prevent the message length from exceeding the limit.
}
export enum RoomState {
  CREATING = 'creating',
  CREATED = 'created',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed',
}
export enum ChatType {
  C2C = 'C2C',
  GROUP = 'GROUP',
  CUSTOM_SERVICE = 'customerService',
  ROOM = 'room',
}
// The editing of messages is left to the homeowner, so you need to get each message and compare it with the userid and assign it to the message if it is the same.
export class ChatExtension {
  static instance?: ChatExtension;
  private message = {} as Message;
  private messagePayload = {} as CustomMessagePayload;
  public chatContext: {
    chat: Record<string, any>;
    SDKAppID: number;
    userID: string;
    userSig: string;
  } = {
    chat: {},
    SDKAppID: 0,
    userID: '',
    userSig: '',
  };
  public myProfile = {} as Profile;
  private customMessages: Record<string, MessageData> = {};
  private isInit = false;
  private chatExtensionSetting: Record<ChatType, boolean> = {
    [ChatType.C2C]: true,
    [ChatType.GROUP]: true,
    [ChatType.CUSTOM_SERVICE]: false,
    [ChatType.ROOM]: false,
  };
  private service?: RoomService;
  private language = 'zh';

  constructor() {
    ChatExtension.instance = this;
    this.initEventCtx();
  }

  public setActiveMeetingMessage(
    message: Message,
    messagePayload: CustomMessagePayload
  ) {
    this.message = message;
    this.messagePayload = messagePayload;
  }

  static getInstance(): ChatExtension {
    if (!ChatExtension.instance) {
      ChatExtension.instance = new ChatExtension();
    }
    return ChatExtension.instance;
  }

  static destroyInstance(): void {
    if (!ChatExtension.instance) return;
    ChatExtension.instance.reset();
    ChatExtension.instance = undefined;
  }

  public _bind(service: RoomService) {
    this.service = service;
    this.init();
  }

  public init() {
    TUICore.registerExtension(
      TUIConstants.TUIChat.EXTENSION.INPUT_MORE.EXT_ID,
      this
    );
    TUICore.registerEvent(
      TUIConstants.TUILogin.EVENT.LOGIN_STATE_CHANGED,
      TUIConstants.TUILogin.EVENT_SUB_KEY.USER_LOGIN_SUCCESS,
      this
    );
    TUICore.registerEvent(
      TUIConstants.TUITranslate.EVENT.LANGUAGE_CHANGED,
      TUIConstants.TUITranslate.EVENT_SUB_KEY.CHANGE_SUCCESS,
      this
    );
  }

  public reset() {
    TUICore.unregisterExtension(
      TUIConstants.TUIChat.EXTENSION.INPUT_MORE.EXT_ID,
      this
    );
    TUICore.unregisterEvent(
      TUIConstants.TUILogin.EVENT.LOGIN_STATE_CHANGED,
      TUIConstants.TUILogin.EVENT_SUB_KEY.USER_LOGIN_SUCCESS,
      this
    );
    TUICore.unregisterEvent(
      TUIConstants.TUITranslate.EVENT.LANGUAGE_CHANGED,
      TUIConstants.TUITranslate.EVENT_SUB_KEY.CHANGE_SUCCESS,
      this
    );
    this.unBindRoomServiceEvent();
    this.unBindRoomEngineEvent();
    this.isInit = false;
  }

  public setHistoryMeetingMessageList(
    type: 'add' | 'delete',
    customMessage: { ID: string; messageData: MessageData }
  ) {
    const { ID, messageData } = customMessage;
    if (messageData.roomState === RoomState.DESTROYED) return;
    if (type === 'add') {
      this.customMessages[ID] = customMessage.messageData;
    } else {
      delete this.customMessages[ID];
    }
  }

  public setChatExtension(chatType: ChatType, isShow: boolean) {
    this.chatExtensionSetting[chatType] = isShow;
  }
  private initEventCtx() {
    this.onRoomDestroy = this.onRoomDestroy.bind(this);
    this.onRemoteUserEnterRoom = this.onRemoteUserEnterRoom.bind(this);
    this.onRemoteUserLeaveRoom = this.onRemoteUserLeaveRoom.bind(this);
    this.onUserRoleChanged = this.onUserRoleChanged.bind(this);
  }
  private bindRoomServiceEvent() {
    this.service?.on(EventType.ROOM_DISMISS, this.onRoomDestroy);
  }
  private bindRoomEngineEvent() {
    roomEngine.instance?.on(
      TUIRoomEvents.onRemoteUserEnterRoom,
      this.onRemoteUserEnterRoom
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onRemoteUserLeaveRoom,
      this.onRemoteUserLeaveRoom
    );
    roomEngine.instance?.on(
      TUIRoomEvents.onUserRoleChanged,
      this.onUserRoleChanged
    );
  }
  private unBindRoomServiceEvent() {
    this.service?.off(EventType.ROOM_DISMISS, this.onRoomDestroy);
  }
  private unBindRoomEngineEvent() {
    roomEngine.instance?.off(
      TUIRoomEvents.onRemoteUserEnterRoom,
      this.onRemoteUserEnterRoom
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onRemoteUserLeaveRoom,
      this.onRemoteUserLeaveRoom
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onUserRoleChanged,
      this.onUserRoleChanged
    );
  }
  private onRemoteUserEnterRoom({
    userInfo,
  }: {
    roomId: string;
    userInfo: TUIUserInfo;
  }) {
    const { userID } = this.chatContext;
    if (this.messagePayload?.owner !== userID) return;
    const { userList } = this.messagePayload;
    const newUserList = [
      ...userList,
      {
        faceUrl: userInfo.avatarUrl,
        nickName: userInfo.nameCard || userInfo.userName,
        userId: userInfo.userId,
      },
    ];
    this.modifyMessage(this.message.ID, {
      userList: newUserList,
      memberCount: newUserList.length,
    });
  }
  private onRemoteUserLeaveRoom({
    userInfo,
  }: {
    roomId: string;
    userInfo: TUIUserInfo;
  }) {
    const { userID } = this.chatContext;
    if (this.messagePayload.owner !== userID) return;
    const { userList } = this.messagePayload;
    const newUserList = userList.filter(
      item => item.userId !== userInfo.userId
    );
    this.modifyMessage(this.message?.ID, {
      userList: newUserList,
      memberCount: newUserList.length,
    });
  }
  private async onUserRoleChanged({
    userId,
    userRole,
  }: {
    userId: string;
    userRole: TUIRole;
  }) {
    const { userID } = this.chatContext;
    if (userRole === TUIRole.kRoomOwner && userId === userID) {
      const profileResult = await this.getUserProfile([userId]);
      const [profile] = profileResult.data;
      const { userID, nick } = profile;
      await this.modifyMessage(this.message.ID, {
        owner: userID, // Homeowner’s userId
        ownerName: nick, // Homeowner’s userName
      });
    }
  }
  private onRoomDestroy() {
    this.destroyRoom();
  }
  public onGetExtension(extensionID: string, params: any) {
    const chatType: ChatType = params?.chatType;
    const extension: ExtensionInfo = {
      weight: -1,
      text: this.service?.t('quick conference') || '快速会议',
      icon: 'https://qcloudimg.tencent-cloud.cn/raw/148ab10dfe654076b41f0d0945bb82e8.png',
      data: {
        name: 'quickRoom',
      },
      listener: {
        onClicked: (data: Conversation) => {
          this.quickRoom(data);
        },
      },
    };
    if (!chatType) return extension; // Old version chatType === undefined ignores configuration and returns directly
    if (!this.chatExtensionSetting[chatType]) return [];
    this.mixinInit(chatType);
    return extension;
  }

  private async mixinInit(chatType: ChatType) {
    if (this.isInit) return;
    if (chatType !== TUIConstants.TUIChat.TYPE.ROOM) {
      !isMobile && setDragAndResize('#roomContainer');
      TUIRoomEngine?.callExperimentalAPI(
        JSON.stringify({
          api: 'setFramework',
          params: {
            component: 'TIMRoomKit',
            language: `vue${VueVersion}`,
          },
        })
      );
      this.bindRoomEngineEvent();
      this.bindRoomServiceEvent();
      roomService.basicStore.setScene('chat');
      roomService.componentManager.setComponentConfig({
        SwitchTheme: { visible: false },
        Language: { visible: false },
        InviteControl: { visible: false },
        RoomLink: { visible: false },
        UserInfo: { visible: false },
      });
      this.chatContext = TUILogin.getContext();
      this.myProfile = await this.getMyProfile();
      this.roomInit(true);
      this.isInit = true;
    }
  }

  private setAnotherMessageRoomState(state: RoomState) {
    Object.keys(this.customMessages).forEach(key => {
      const { roomState, isRoomCreateByMe, isInnerRoom } =
        this.customMessages[key];
      if (
        roomState !== RoomState.DESTROYED &&
        isRoomCreateByMe &&
        !isInnerRoom
      ) {
        this.modifyMessage(key, { roomState: state });
      }
      if (roomState === RoomState.DESTROYED) {
        this.setHistoryMeetingMessageList('delete', {
          ID: key,
          messageData: this.customMessages[key],
        });
      }
      1;
    });
  }
  private async quickRoom(data: Conversation) {
    if (this.getIsMeetingInProgress()) {
      this.service?.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
        code: -1,
        message: this.service?.t(
          'Currently in a meeting, please exit the current meeting before proceeding.'
        ),
      });
      return;
    }
    try {
      this.setAnotherMessageRoomState(RoomState.DESTROYED);
      const { conversationID, type } = data;
      this.roomInit();
      const { chat, userID } = this.chatContext;
      const roomOptions = getRoomOptions();
      const message = this.createCustomMessage({
        chat,
        userID,
        roomId: roomOptions.roomId,
        conversationID,
        conversationType: type,
        roomState: RoomState.CREATING,
      });
      this.updateMessageList(message);
      await this.service?.start(roomOptions.roomId, {
        roomOptions,
      } as StartParams);
      this.message = message;
      this.messagePayload = this.parseMessageData(message);
      await this.sendMessage(message);
      await this.modifyMessage(message.ID, {
        messageId: message.ID,
        roomState: RoomState.CREATED,
      });
    } catch (error) {
      this.service?.emit(EventType.ROOM_NOTICE_MESSAGE, {
        code: -1,
        type: 'error',
        message: this.service?.t('Failed to initiate meeting'),
      });
      throw error;
    }
  }
  private async destroyRoom() {
    await this.modifyMessage(this.message.ID, {
      roomState: RoomState.DESTROYED,
    });
  }
  public async onNotifyEvent(
    eventName: string,
    subKey: string,
    params?: Record<string, any>
  ) {
    if (eventName === TUIConstants.TUITranslate.EVENT.LANGUAGE_CHANGED) {
      if (subKey === TUIConstants.TUITranslate.EVENT_SUB_KEY.CHANGE_SUCCESS) {
        const language = params?.language;
        this.language = language; // language = zh or en
        setLanguage(language);
      }
    }
  }

  private async roomInit(deep?: boolean) {
    this.service?.roomStore.reset();
    this.service?.initMediaDeviceList();
    const { SDKAppID, userID, userSig } = this.chatContext;
    const { nick = '', avatar = defaultAvatarUrl } = this.myProfile;
    this.service &&
      this.service[deep ? 'initRoomKit' : 'storeInit']({
        // To get sdkAppId, please refer to Step One
        sdkAppId: SDKAppID,
        // The unique Id of the user in your business
        userId: userID,
        // For local development and debugging, you can quickly generate userSig on the page https://console.cloud.tencent.com/trtc/usersigtool. Note that userSig and userId have a one-to-one correspondence
        userSig,
        // The nickname used by the user in your business
        userName: nick,
        // The avatar link used by the user in your business
        avatarUrl: avatar,
        // The skin theme color needed by the user in your business and whether to support switching skin themes
        theme: {
          isSupportSwitchTheme: false,
        },
      });
  }
  public async enterRoom(roomId: string, message: Message) {
    if (this.getIsMeetingInProgress()) {
      this.service?.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
        code: -1,
        message: this.service?.t(
          'Currently in a meeting, please exit the current meeting before proceeding.'
        ),
      });
      return;
    }
    this.message = message;
    this.messagePayload = this.parseMessageData(message);
    const roomParam = {
      isOpenCamera: true,
      isOpenMicrophone: true,
    };
    this.roomInit();
    try {
      await this.service?.join(roomId, { roomParam } as JoinParams);
    } catch (err: any) {
      if (err.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) {
        this.modifyMessage(this.message.ID, { roomState: RoomState.DESTROYED });
      }
    }
    this.setAnotherMessageRoomState(RoomState.DESTROYED);
  }
  private createCustomMessage(params: Record<string, any>): Message {
    const {
      chat,
      userID,
      conversationID,
      conversationType,
      roomState,
      roomId,
    } = params;
    const message = chat.createCustomMessage({
      to: conversationID.slice(conversationType.length),
      conversationType,
      payload: this.generatePayloadForMessage({
        roomId,
        userID,
        conversationID,
        roomState,
      }),
    });
    return message;
  }
  private async sendMessage(message: Message) {
    const { chat } = this.chatContext;
    return chat.sendMessage(message);
  }
  private updateMessageList(message: Message) {
    TUICore.callService({
      serviceName: TUIConstants.TUIChat.SERVICE.NAME,
      method: TUIConstants.TUIChat.SERVICE.METHOD.UPDATE_MESSAGE_LIST,
      params: {
        message,
      },
    });
  }
  private async modifyMessage(messageId: string, params: any) {
    const { chat } = this.chatContext;
    const message = await chat.findMessage(messageId);
    let payloadData = this.parseMessageData(message);
    payloadData = {
      ...payloadData,
      ...params,
    };
    message.payload.data = JSON.stringify(payloadData);
    return await chat.modifyMessage(message);
  }
  private generatePayloadForMessage(params: {
    roomId: string;
    userID: string;
    conversationID: string;
    roomState: RoomState;
  }) {
    const { roomId, userID, conversationID, roomState } = params;
    const { nick = '', avatar = '' } = this.myProfile;
    const payload = {
      data: JSON.stringify({
        version: 1,
        businessID: 'group_room_message',
        groupId: conversationID, // todo The current version does not modify this, waiting for the IM solution
        messageId: '', // Used to find and update a specific message after the audience becomes the host.
        roomId, // The id of the room, a required parameter for enterRoom
        owner: userID, // The userId of the room owner
        ownerName: nick, // The userName of the room owner
        roomState, // The current room state, there are four states: creating/created/destroying/destroyed
        memberCount: 1, // The number of people in the current room, it needs to be displayed on the UI how many people are in the meeting.
        userList: [
          {
            faceUrl: avatar,
            nickName: nick,
            userId: userID,
          },
        ], // A list of invited users, including the host, can be displayed at most 5 to prevent the message length from exceeding the limit.
      }),
    };
    return payload;
  }

  public parseMessageData(message: Message): CustomMessagePayload {
    return parseMessageData(message);
  }
  public async getMyProfile() {
    const { chat } = this.chatContext;
    const res = await chat.getMyProfile();
    return res?.data || {};
  }

  private getUserProfile(userIDList: Array<string>) {
    const { chat } = this.chatContext;
    return chat.getUserProfile({
      userIDList, // Please note: Even if you only pull the information of one user, you still need to use the array type, for example: userIDList: ['user1']
    });
  }

  private getIsMeetingInProgress(): boolean {
    return !!this.service?.basicStore.roomId;
  }

  public getOnGoingRoomId() {
    return this.service?.basicStore.roomId;
  }
}

export const chatExtension = ChatExtension.getInstance();
