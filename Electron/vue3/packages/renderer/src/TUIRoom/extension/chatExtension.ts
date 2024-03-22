import { ExtensionInfo, TUIConstants, TUICore, TUILogin } from '@tencentcloud/tui-core';
import TUIRoomEngine, {
  TUIErrorCode,
  TUIRole,
  TUIRoomEvents,
  TUIUserInfo,
} from '@tencentcloud/tuiroom-engine-electron';
import { EventType, roomEngine, RoomParam, roomService, RoomService } from '../services';
import { setDragAndResize } from './utils/interact';
import { Conversation, Message, Profile } from '@tencentcloud/chat';
import { isMobile } from '../utils/environment';
import { setLanguage } from './utils/setLanguage';
import { VueVersion } from './utils/common';
import { parseMessageData } from './utils/judgeRoomMessage';
const defaultAvatarUrl = 'https://qcloudimg.tencent-cloud.cn/raw/6a075bead54faca9ca378f4d89c62fae.png';

export interface MessageData {
  ID?: string
  isInnerRoom: boolean
  isRoomMessage: boolean
  isRoomCreateByMe: boolean
  isMessageFromMe: boolean
  roomId: string
  roomState: RoomState
  userList: Array<{ faceUrl: string; nickName: string; userId: string }>
  myProfile: Profile
  ownerName: string
  owner: string
}
const loadStyle = () => {
  import('./index.scss');
};

const getRoomOptions = () => ({
  roomId: String(Math.ceil(Math.random() * 1000000)),
  roomMode: 'FreeToSpeak',
  roomParam: {
    isOpenCamera: true,
    isOpenMicrophone: true,
  },
} as {
  roomId: string;
  roomName?: string;
  roomMode: 'FreeToSpeak' | 'SpeakAfterTakingSeat';
  roomParam?: RoomParam;
});
export interface CustomMessagePayload {
  version: number
  businessID: string // 固定值，用于在IM上区分当前消息是哪类自定义消息。
  groupId: string // 邀请群成员入会时，需要用到groupId来获取群成员列表。
  messageId: string // 用于观众成为房主后，通过messageId 来查找并更新指定消息。
  roomId: string // 房间的id，enterRoom 必须的参数
  owner: string // 房主的userId
  ownerName: string // 房主的userName
  roomState: RoomState // 当前的房间状态，有creating/created/destroying/destroyed 四种状态
  memberCount: 1 // 当前房间内有多少人，需要在ui上展示有多少人在会议中。
  userList: Array<{ faceUrl: string; nickName: string; userId: string }> // 包括房主在内的被邀请用户的列表，最多展示5个，防止消息长度超出限制。
}
export enum RoomState {
  CREATING = 'creating',
  CREATED = 'created',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed'
}
export enum ChatType {
  C2C = 'C2C',
  GROUP = 'GROUP',
  CUSTOM_SERVICE = 'customerService',
  ROOM = 'room'
}
// message 的编辑都交给房主处理，因此需要拿到每条message 然后对比 userid 相同的时候将其赋给message
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
  private customMessages: Record<
    string,
    MessageData
  > = {};
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

  public setActiveMeetingMessage(message: Message, messagePayload: CustomMessagePayload) {
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
    TUICore.registerExtension(TUIConstants.TUIChat.EXTENSION.INPUT_MORE.EXT_ID, this);
    TUICore.registerEvent(
      TUIConstants.TUILogin.EVENT.LOGIN_STATE_CHANGED,
      TUIConstants.TUILogin.EVENT_SUB_KEY.USER_LOGIN_SUCCESS,
      this,
    );
    TUICore.registerEvent(
      TUIConstants.TUITranslate.EVENT.LANGUAGE_CHANGED,
      TUIConstants.TUITranslate.EVENT_SUB_KEY.CHANGE_SUCCESS,
      this,
    );
  }

  public reset() {
    TUICore.unregisterExtension(TUIConstants.TUIChat.EXTENSION.INPUT_MORE.EXT_ID, this);
    TUICore.unregisterEvent(
      TUIConstants.TUILogin.EVENT.LOGIN_STATE_CHANGED,
      TUIConstants.TUILogin.EVENT_SUB_KEY.USER_LOGIN_SUCCESS,
      this,
    );
    TUICore.unregisterEvent(
      TUIConstants.TUITranslate.EVENT.LANGUAGE_CHANGED,
      TUIConstants.TUITranslate.EVENT_SUB_KEY.CHANGE_SUCCESS,
      this,
    );
    this.unBindRoomServiceEvent();
    this.unBindRoomEngineEvent();
  }

  public setHistoryMeetingMessageList(type: 'add' | 'delete', customMessage: {ID: string, messageData: MessageData}) {
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
    this.service?.on(EventType.ROOM_DESTROY, this.onRoomDestroy);
  }
  private bindRoomEngineEvent() {
    roomEngine.instance?.on(TUIRoomEvents.onRemoteUserEnterRoom, this.onRemoteUserEnterRoom);
    roomEngine.instance?.on(TUIRoomEvents.onRemoteUserLeaveRoom, this.onRemoteUserLeaveRoom);
    roomEngine.instance?.on(TUIRoomEvents.onUserRoleChanged, this.onUserRoleChanged);
  }
  private unBindRoomServiceEvent() {
    this.service?.off(EventType.ROOM_DESTROY, this.onRoomDestroy);
  }
  private unBindRoomEngineEvent() {
    roomEngine.instance?.off(TUIRoomEvents.onRemoteUserEnterRoom, this.onRemoteUserEnterRoom);
    roomEngine.instance?.off(TUIRoomEvents.onRemoteUserLeaveRoom, this.onRemoteUserLeaveRoom);
    roomEngine.instance?.off(TUIRoomEvents.onUserRoleChanged, this.onUserRoleChanged);
  }
  private onRemoteUserEnterRoom({ userInfo }: { roomId: string; userInfo: TUIUserInfo }) {
    const { userID } = this.chatContext;
    if (this.messagePayload?.owner !== userID) return;
    const { userList } = this.messagePayload;
    const newUserList = [
      ...userList,
      {
        faceUrl: userInfo.avatarUrl,
        nickName: userInfo.userName,
        userId: userInfo.userId,
      },
    ];
    this.modifyMessage(this.message.ID, {
      userList: newUserList,
      memberCount: newUserList.length,
    });
  }
  private onRemoteUserLeaveRoom({ userInfo }: { roomId: string; userInfo: TUIUserInfo }) {
    const { userID } = this.chatContext;
    if (this.messagePayload.owner !== userID) return;
    const { userList } = this.messagePayload;
    const newUserList = userList.filter(item => item.userId !== userInfo.userId);
    this.modifyMessage(this.message?.ID, {
      userList: newUserList,
      memberCount: newUserList.length,
    });
  }
  private async onUserRoleChanged({ userId, userRole }: { userId: string; userRole: TUIRole }) {
    const { userID } = this.chatContext;
    if (userRole === TUIRole.kRoomOwner && userId === userID) {
      const profileResult = await this.getUserProfile([userId]);
      const [profile] = profileResult.data;
      const { userID, nick } = profile;
      await this.modifyMessage(this.message.ID, {
        owner: userID, // 房主的userId
        ownerName: nick, // 房主的userName
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
      text: this.service?.t('quick meeting') || '快速会议',
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
    if (!chatType) return extension; // 老版本 chatType === undefined 忽略配置直接 return
    if (!this.chatExtensionSetting[chatType]) return;
    return extension;
  }

  private setAnotherMessageRoomState(state: RoomState) {
    Object.keys(this.customMessages).forEach((key) => {
      const { roomState, isRoomCreateByMe, isInnerRoom } = this.customMessages[key];
      if (roomState !== RoomState.DESTROYED && isRoomCreateByMe && !isInnerRoom) {
        this.modifyMessage(key, { roomState: state });
      }
      if (roomState === RoomState.DESTROYED) {
        this.setHistoryMeetingMessageList('delete', { ID: key, messageData: this.customMessages[key] });
      }1;
    });
  }
  private async quickRoom(data: Conversation) {
    if (this.getIsMeetingInProgress()) {
      this.service?.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
        code: -1,
        message: this.service?.t('Currently in a meeting, please exit the current meeting before proceeding.'),
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
      await this.service?.createRoom(roomOptions);
      await this.service?.enterRoom(roomOptions);
      this.message = message;
      this.messagePayload = this.parseMessageData(message);
      await this.sendMessage(message);
      await this.modifyMessage(message.ID, { messageId: message.ID, roomState: RoomState.CREATED });
    } catch(error) {
      this.service?.emit(EventType.ROOM_NOTICE_MESSAGE, {
        code: -1,
        type: 'error',
        message: this.service?.t('Failed to initiate meeting'),
      });
      throw error;
    }
  }
  private async destroyRoom() {
    await this.modifyMessage(this.message.ID, { roomState: RoomState.DESTROYED });
  }
  public async onNotifyEvent(eventName: string, subKey: string, params?: Record<string, any>) {
    if (eventName === TUIConstants.TUILogin.EVENT.LOGIN_STATE_CHANGED) {
      if (subKey === TUIConstants.TUILogin.EVENT_SUB_KEY.USER_LOGIN_SUCCESS) {
        // 收到登录成功时执行自己的业务逻辑处理
        !isMobile && setDragAndResize('#roomContainer');
        TUIRoomEngine?.callExperimentalAPI(JSON.stringify({
          api: 'setFramework',
          params: {
            component: 'TIMRoomKit',
            language: `vue${VueVersion}`,
          },
        }));
        this.bindRoomEngineEvent();
        this.bindRoomServiceEvent();
        loadStyle();
        roomService.setComponentConfig({
          SwitchTheme: {visible: false},
          InviteControl: {visible: false},
          RoomLink: {visible: false},
        });
        this.chatContext = TUILogin.getContext();
        this.myProfile =  await this.getMyProfile();
        this.roomInit(true);
      }
    }
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
    this.service && this.service[deep ? 'initRoomKit' : 'storeInit']({
      // 获取 sdkAppId 请您参考 步骤一
      sdkAppId: SDKAppID,
      // 用户在您业务中的唯一标示 Id
      userId: userID,
      // 本地开发调试可在 https://console.cloud.tencent.com/trtc/usersigtool 页面快速生成 userSig, 注意 userSig 与 userId 为一一对应关系
      userSig,
      // 用户在您业务中使用的昵称
      userName: nick,
      // 用户在您业务中使用的头像链接
      avatarUrl: avatar,
      // 用户在您业务中需要的皮肤主题颜色及是否支持切换皮肤主题
      theme: {
        isSupportSwitchTheme: false,
      },
    });
  }
  public async enterRoom(roomId: string, message: Message) {
    if (this.getIsMeetingInProgress()) {
      this.service?.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
        code: -1,
        message: this.service?.t('Currently in a meeting, please exit the current meeting before proceeding.'),
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
      await this.service?.enterRoom({ roomId, roomParam });
    } catch (err: any) {
      if (err.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) {
        this.modifyMessage(this.message.ID, { roomState: RoomState.DESTROYED });
      }
    }
    this.setAnotherMessageRoomState(RoomState.DESTROYED);
  }
  private createCustomMessage(params: Record<string, any>): Message {
    const { chat, userID, conversationID, conversationType, roomState, roomId } = params;
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
    roomId: string
    userID: string
    conversationID: string
    roomState: RoomState
  }) {
    const { roomId, userID, conversationID, roomState } = params;
    const { nick = '', avatar = '' } = this.myProfile;
    const payload = {
      data: JSON.stringify({
        version: 1,
        businessID: 'group_room_message',
        groupId: conversationID, // todo 当前版本暂不修改，等待im方案
        messageId: '', // 用于观众成为房主后，通过 messageId 来查找并更新指定消息。
        roomId, // 房间的id，enterRoom 必须的参数
        owner: userID, // 房主的userId
        ownerName: nick, // 房主的userName
        roomState, // 当前的房间状态，有creating/created/destroying/destroyed 四种状态
        memberCount: 1, // 当前房间内有多少人，需要在ui上展示有多少人在会议中。
        userList: [
          {
            faceUrl: avatar,
            nickName: nick,
            userId: userID,
          },
        ], // 包括房主在内的被邀请用户的列表，最多展示5个，防止消息长度超出限制。
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
      userIDList, // 请注意：即使只拉取一个用户的资料，也需要用数组类型，例如：userIDList: ['user1']
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

