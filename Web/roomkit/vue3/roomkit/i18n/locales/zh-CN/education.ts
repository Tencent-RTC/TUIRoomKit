import type { TranslationKey } from '../../index';

/**
 * The `education` namespace. Scene code reads it through `useI18n('education')` or
 * `i18n.getFixedT(null, 'education')`; a key it lacks falls back to the base pack, and
 * shared feature components keep reading the base pack only.
 *
 * Keys here reword base keys, so the base key list checks their spelling.
 */
export const resource = {
  'Room.RoomEnded': '老师已下课，课堂已结束',
  'RoomNotifications.KickedByAdmin': '您已被老师移出教室',
  'RoomNotifications.KickedByServer': '您已被服务器移出教室',
  'RoomNotifications.DefaultKickedOut': '您已被移出教室',
  'RoomNotifications.ConnectionTimeout': '网络连接超时，已退出课堂',
  'RoomNotifications.InvalidStatusOnReconnect': '课堂已结束或您在离线期间已被移出',
  'RoomNotifications.RoomLimitExceeded': '课堂人数已达上限，无法加入',
  'RoomNotifications.AudioPlaybackFailed': '点击继续播放，以听到课堂中的声音。',
} satisfies Partial<Record<TranslationKey, string>>;
