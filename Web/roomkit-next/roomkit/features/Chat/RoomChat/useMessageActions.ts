import type { Component } from 'vue';
import { computed } from 'vue';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import {
  MessageStatus,
  MessageType,
  useMessageActionStore,
} from 'tuikit-atomicx-vue3/chat';
import { IconCopy, IconDelete, IconRecall, TUIToast } from '../../../base';
import { t } from '../../../base/i18n';
import { copyTextToClipboard } from './copyText';
import { emojiUrlMap } from './emoji';

export interface MessageAction {
  key: string;
  label: string;
  icon?: Component;
  danger?: boolean;
  onClick?: (message: MessageInfo) => void | Promise<void>;
  visible?: boolean | ((message: MessageInfo) => boolean);
}

const RECALL_WINDOW_MS = 2 * 60 * 1000;

function toPlainText(message: MessageInfo): string {
  if (message.messageType !== MessageType.Text) return '';
  const text = (message.messagePayload as { text?: string })?.text ?? '';
  return text.replace(/\[TUIEmoji_\w+\]/g, match => (emojiUrlMap[match] ? '' : match)).trim() || text;
}

export function useMessageActions(
  actionKeys: Array<MessageAction['key']> = ['copy', 'recall', 'delete'],
) {
  const handlers: Record<string, (message: MessageInfo) => void | Promise<void>> = {
    copy: (message) => {
      copyTextToClipboard(toPlainText(message))
        .then(() => TUIToast.success(t('RoomChat.copy_success')))
        .catch(() => TUIToast.error(t('RoomChat.copy_failed')));
    },
    recall: (message) => {
      const actionStore = useMessageActionStore(message);
      return actionStore.revoke()
        .then(() => {
          TUIToast.success(t('RoomChat.recall_success'));
        })
        .catch((err: { code?: number }) => {
          TUIToast.error(
            err.code === 20016 ? t('RoomChat.recall_time_limit') : t('RoomChat.recall_failed'),
          );
          throw err;
        })
        .finally(() => actionStore.destroy());
    },
    delete: (message) => {
      const actionStore = useMessageActionStore(message);
      return actionStore.delete()
        .then(() => {
          TUIToast.success(t('RoomChat.delete_success'));
        })
        .catch(() => {
          TUIToast.error(t('RoomChat.delete_failed'));
          throw new Error('delete failed');
        })
        .finally(() => actionStore.destroy());
    },
  };

  return computed(() => {
    const defaults: Record<string, MessageAction> = {
      copy: {
        key: 'copy',
        label: t('RoomChat.copy'),
        icon: IconCopy,
        visible: message => message.messageType === MessageType.Text,
      },
      recall: {
        key: 'recall',
        label: t('RoomChat.recall'),
        icon: IconRecall,
        visible: message => (
          message.isSentBySelf
          && message.status === MessageStatus.SendSuccess
          && Date.now() - (message.timestamp?.getTime() ?? 0) < RECALL_WINDOW_MS
        ),
      },
      delete: {
        key: 'delete',
        label: t('RoomChat.delete'),
        icon: IconDelete,
        danger: true,
        visible: message => (
          message.status === MessageStatus.SendSuccess
          || message.status === MessageStatus.SendFail
        ),
      },
    };

    return actionKeys.map(key => ({
      ...defaults[key],
      onClick: handlers[key],
    })).filter(action => Boolean(action.key));
  });
}
