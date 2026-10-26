import { t } from '../../../base';

export function getSendErrorMessage(error: unknown): string {
  const errorCode = (error as { code?: number })?.code;
  switch (errorCode) {
    case 10017:
    case 10010:
      return t('RoomChat.muted_send_failed');
    case 80001:
      return t('RoomChat.sensitive_word');
    case 10007:
      return t('RoomChat.not_in_group');
    case 2351:
      return t('RoomChat.video_size_exceeded');
    default:
      return t('RoomChat.send_failed');
  }
}
