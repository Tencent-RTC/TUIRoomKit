import { chatExtension, RoomState, MessageData } from '../chatExtension';
import { Message, Profile } from '@tencentcloud/chat';
import { getIsRoomCardMessage } from '../utils/judgeRoomMessage';

/**
 * Rendering cards requires isRoomMessage, isRoomCreateByMe, userList, isEnterRoom
 * ChatExtension provides basic functions such as editing messages, sending messages, displaying messages on the screen.
 * HandleRoomMessage implements business functions such as initiating meetings, joining meetings, leaving meetings.
 */

export class HandleRoomMessage {
  private message = {} as Message;
  public messageData: MessageData = {
    isInnerRoom: false,
    isRoomMessage: false,
    isRoomCreateByMe: false,
    isMessageFromMe: false,
    roomId: '',
    roomState: RoomState.CREATED,
    userList: [],
    myProfile: {} as Profile,
    ownerName: '',
    owner: '',
  };

  public initialize(message: Message) {
    this.handleMessage(message);
  }

  public destroy() {
    chatExtension.setHistoryMeetingMessageList('delete', {
      ID: this.message.ID,
      messageData: this.messageData,
    });
  }

  // Get card information
  private handleMessage(message: Message) {
    this.message = message;
    const currentUser = chatExtension.chatContext?.userID;
    const messagePayload = this.parseMessageData(message);
    if (!getIsRoomCardMessage(message)) return;
    const { businessID, owner, roomId, roomState, userList, ownerName } =
      messagePayload;
    const isRoomDestroyed = roomState === RoomState.DESTROYED;
    const isInnerRoom =
      chatExtension.getOnGoingRoomId() === roomId &&
      userList.some(u => u.userId === currentUser) &&
      !isRoomDestroyed;
    const isRoomCreateByMe = owner === currentUser;
    if (isRoomCreateByMe && isInnerRoom && !isRoomDestroyed) {
      chatExtension.setActiveMeetingMessage(message, messagePayload);
    }
    this.messageData = {
      isInnerRoom,
      isRoomMessage: businessID === 'group_room_message',
      isRoomCreateByMe,
      isMessageFromMe: message.from === currentUser,
      roomId,
      roomState,
      userList,
      myProfile: chatExtension.myProfile,
      ownerName,
      owner,
    };
    chatExtension.setHistoryMeetingMessageList('add', {
      ID: message.ID,
      messageData: this.messageData,
    });
  }

  public parseMessageData(message: Message) {
    return chatExtension.parseMessageData(message);
  }
}

export const handleRoomMessage = new HandleRoomMessage();
