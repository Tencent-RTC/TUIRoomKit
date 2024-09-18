import { Message } from '@tencentcloud/chat';

export const getIsRoomCardMessage = (message: Message) => {
  const data = parseMessageData(message);
  return data?.businessID === 'group_room_message';
};
export const getIsRoomSignalingMessage = (message: Message) => {
  const data = parseMessageData(message);
  return (
    data?.data?.businessID === 'ROOM_INVITE_ACTION' ||
    data?.data?.businessID === 'tuikit_engine_room'
  );
};
export const parseMessageData = (message: Message) => {
  try {
    const data = message?.payload?.data;
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.warn('parseMessageData error:', err);
    return {};
  }
};
