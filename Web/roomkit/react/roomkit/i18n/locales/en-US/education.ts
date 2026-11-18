import type { TranslationKey } from '../../index';

/** The `education` namespace; see `./zh-CN` for how it is read. */
export const resource = {
  'Room.RoomEnded': 'The teacher ended the class. The classroom is closed.',
  'RoomNotifications.KickedByAdmin': 'The teacher removed you from the classroom',
  'RoomNotifications.KickedByServer': 'The server removed you from the classroom',
  'RoomNotifications.DefaultKickedOut': 'You have been removed from the classroom',
  'RoomNotifications.ConnectionTimeout': 'Connection timed out. You have left the class.',
  'RoomNotifications.InvalidStatusOnReconnect': 'The class has ended, or you were removed while offline',
  'RoomNotifications.RoomLimitExceeded': 'The class is full, so you can\'t join',
  'RoomNotifications.AudioPlaybackFailed': 'Tap to continue so you can hear the class.',
} satisfies Partial<Record<TranslationKey, string>>;
