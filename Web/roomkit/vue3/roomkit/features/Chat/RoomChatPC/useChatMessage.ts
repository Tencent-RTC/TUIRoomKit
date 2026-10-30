import { computed, inject, ref, watch } from 'vue';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import {
  MessageStatus,
  MessageType,
  useLoginStore,
} from 'tuikit-atomicx-vue3/chat';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { TUIMessageBox, TUIToast, t } from '../../../base';
import { formatTimestampToTime } from '../../../utils/formatTimestamp';
import { EDU_CLASS_EVENT_ID, parseCustomEnvelope } from '../customMessage';
import { emojiBaseUrl, emojiUrlMap } from './emoji';
import { getSendErrorMessage } from './getSendErrorMessage';
import { useChatComposer } from './useChatComposer';
import type { MessageAction } from './useMessageActions';
import { useMessageOverlay } from './useMessageOverlay';
import { useSenderProfile } from './useSenderName';

/**
 * Notice-line copy for known custom protocols: education class events
 * announce joins and leaves on the timeline.
 */
function eduClassEventCopy(message: MessageInfo): { key: string; params: Record<string, string> } | undefined {
  const envelope = parseCustomEnvelope(message);
  if (!envelope || envelope.businessID !== EDU_CLASS_EVENT_ID) {
    return undefined;
  }
  const name = String(envelope.data.targetName ?? '');
  switch (envelope.event) {
    case 'member-enter':
      return { key: 'Education.Sync.EnteredRoom', params: { name } };
    case 'member-leave':
      return { key: 'Education.Sync.LeftRoom', params: { name } };
    default:
      return undefined;
  }
}

export interface ChatMessageProps {
  readonly message: MessageInfo;
  readonly actions: readonly MessageAction[];
  /** Tints the room owner's bubbles with the self-message accent. */
  readonly isHighlightOwner?: boolean;
}

export function useChatMessage(props: ChatMessageProps) {
  const menuOpen = ref(false);
  const chatScrollTick = inject('chatScrollTick', ref(false));
  watch(chatScrollTick, () => {
    menuOpen.value = false;
  });
  const resolveProfile = useSenderProfile();
  const { getChat } = useLoginStore();
  const overlay = useMessageOverlay();
  const composer = useChatComposer();
  const lastTextPayload = ref('');
  let retryLocked = false;
  const { currentRoom } = useRoomState();

  watch(() => props.message.status, (status) => {
    if (status !== MessageStatus.Recalled && status !== MessageStatus.Deleted) return;
    overlay?.clear(props.message.id);
  });
  watch(
    () => (props.message.messageType === MessageType.Text ? props.message.messagePayload.text : ''),
    (text) => {
      // Keep the raw emoji keys so re-edit can restore the original draft.
      if (text) {
        lastTextPayload.value = text;
      }
    },
    { immediate: true },
  );

  const senderProfile = computed(() => resolveProfile(props.message));
  const senderName = computed(() => senderProfile.value.name);
  const senderAvatar = computed(() => senderProfile.value.avatarUrl);
  /* Only when the panel opts in: the design paints the room owner's bubbles
   * with the same accent tint as one's own messages, so the owner stands out
   * while staying left-aligned. */
  const isOwnerMessage = computed(() => (
    Boolean(props.isHighlightOwner)
    && Boolean(props.message.from?.userID)
    && props.message.from?.userID === currentRoom.value?.roomOwner?.userId
  ));
  const displayStatus = computed(() => {
    // Read the map size so this computed refreshes when an overlay is patched.
    Number(overlay?.overlays.size);
    return overlay?.statusOf(props.message) ?? props.message.status;
  });
  const isRecalled = computed(() => displayStatus.value === MessageStatus.Recalled);
  const isFailed = computed(() => displayStatus.value === MessageStatus.SendFail);
  const isSending = computed(() => (
    displayStatus.value === MessageStatus.Sending || displayStatus.value === MessageStatus.InitStatus
  ));
  const recalledText = computed(() => (
    props.message.isSentBySelf
      ? t('RoomChat.you_recalled')
      : t('RoomChat.recalled', { name: senderName.value })
  ));
  const canReedit = computed(() => (
    props.message.isSentBySelf
    && isRecalled.value
    && Boolean(lastTextPayload.value)
  ));
  const displayTimestamp = computed(() => overlay?.timestampOf(props.message) ?? props.message.timestamp);
  const timeText = computed(() => formatTimestampToTime(displayTimestamp.value, 'HH:mm'));
  const visibleActions = computed(() => {
    const status = displayStatus.value;
    const timestamp = displayTimestamp.value;
    const messageForActions = (
      status === props.message.status && timestamp === props.message.timestamp
    )
      ? props.message
      : { ...props.message, status, timestamp };
    return props.actions.filter((action) => {
      if (typeof action.visible === 'function') return action.visible(messageForActions);
      return action.visible !== false;
    });
  });
  const bubbleKind = computed(() => {
    switch (props.message.messageType) {
      case MessageType.Text:
        return 'text';
      case MessageType.File:
        return 'file';
      case MessageType.Image:
        return 'image';
      case MessageType.Video:
        return 'video';
      case MessageType.Custom:
        // Known custom protocols render as centered notice lines.
        return eduClassEventCopy(props.message) !== undefined ? 'notice' : 'unknown';
      default:
        return 'unknown';
    }
  });
  const noticeText = computed(() => {
    if (bubbleKind.value !== 'notice') return '';
    const copy = eduClassEventCopy(props.message);
    return copy ? t(copy.key, copy.params) : '';
  });
  const textParts = computed(() => splitTextWithEmoji(
    props.message.messageType === MessageType.Text ? props.message.messagePayload.text : '',
  ));
  const fileName = computed(() => (
    props.message.messageType === MessageType.File
      ? props.message.messagePayload.fileName || t('RoomChat.file_fallback')
      : t('RoomChat.file_fallback')
  ));
  const fileSizeText = computed(() => (
    props.message.messageType === MessageType.File
      ? formatFileSize(props.message.messagePayload.fileSize)
      : ''
  ));
  const imageThumb = computed(() => {
    if (props.message.messageType !== MessageType.Image) {
      return '';
    }
    const payload = props.message.messagePayload;
    return payload.thumbImageURL || payload.largeImageURL || payload.originalImageURL || '';
  });
  const imageOpenUrl = computed(() => {
    if (props.message.messageType !== MessageType.Image) {
      return '';
    }
    const payload = props.message.messagePayload;
    return payload.originalImageURL || payload.largeImageURL || payload.thumbImageURL || '';
  });
  const videoOpenUrl = computed(() => (
    props.message.messageType === MessageType.Video
      ? props.message.messagePayload.videoURL || ''
      : ''
  ));
  const videoPoster = computed(() => (
    props.message.messageType === MessageType.Video
      ? props.message.messagePayload.videoSnapshotURL || ''
      : ''
  ));
  const videoDurationText = computed(() => (
    props.message.messageType === MessageType.Video
      ? formatDuration(props.message.messagePayload.videoDuration)
      : ''
  ));
  const fallbackText = computed(() => t('RoomChat.unsupported'));

  function splitTextWithEmoji(text: string) {
    const parts: Array<{ text?: string; src?: string }> = [];
    const matcher = /\[TUIEmoji_\w+\]/g;
    let last = 0;
    for (const match of text.matchAll(matcher)) {
      const token = match[0];
      const index = match.index ?? 0;
      if (index > last) parts.push({ text: text.slice(last, index) });
      const file = emojiUrlMap[token];
      if (file) parts.push({ src: `${emojiBaseUrl}${file}` });
      else parts.push({ text: token });
      last = index + token.length;
    }
    if (last < text.length) parts.push({ text: text.slice(last) });
    return parts.length ? parts : [{ text }];
  }

  function formatFileSize(bytes?: number) {
    if (!bytes || bytes <= 0) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb >= 10 ? Math.round(kb) : kb.toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDuration(seconds?: number) {
    if (!seconds || seconds <= 0) return '';
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${minutes}:${String(rest).padStart(2, '0')}`;
  }

  function reeditRecalled() {
    composer?.fillDraft(lastTextPayload.value);
  }

  function onActionCommand(command: string | number) {
    const action = visibleActions.value.find(item => item.key === command);
    const result = action?.onClick?.(props.message);
    if (result == null || (action?.key !== 'recall' && action?.key !== 'delete')) return;
    Promise.resolve(result)
      .then(() => {
        menuOpen.value = false;
        if (action.key === 'recall') {
          overlay?.patch(props.message.id, { status: MessageStatus.Recalled });
          return;
        }
        overlay?.patch(props.message.id, { status: MessageStatus.Deleted });
      })
      .catch(() => undefined);
  }

  async function downloadFile() {
    const { message } = props;
    if (message.messageType !== MessageType.File) return;
    const url = message.messagePayload.fileURL;
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('download failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName.value;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      TUIToast.error(t('RoomChat.download_failed'));
    }
  }

  async function retrySend() {
    if (retryLocked || !isFailed.value) return;
    retryLocked = true;
    try {
      const confirmed = await TUIMessageBox.confirm({
        title: t('RoomChat.resend_title'),
        message: t('RoomChat.resend_confirm_message'),
        confirmText: t('RoomChat.resend_confirm'),
        cancelText: t('RoomChat.resend_cancel'),
        closable: false,
      });
      if (!confirmed) return;
      const raw = (props.message as MessageInfo & { _rawSDK?: unknown })._rawSDK;
      await getChat()?.resendMessage(raw);
    } catch (error) {
      TUIToast.error(getSendErrorMessage(error));
    } finally {
      retryLocked = false;
    }
  }

  return {
    isRecalled,
    canReedit,
    recalledText,
    senderAvatar,
    senderName,
    isOwnerMessage,
    timeText,
    isFailed,
    isSending,
    menuOpen,
    visibleActions,
    bubbleKind,
    textParts,
    fileName,
    fileSizeText,
    imageThumb,
    imageOpenUrl,
    videoOpenUrl,
    videoPoster,
    videoDurationText,
    fallbackText,
    noticeText,
    reeditRecalled,
    retrySend,
    onActionCommand,
    downloadFile,
  };
}
