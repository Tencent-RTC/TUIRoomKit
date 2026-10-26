import { useContext, useEffect, useRef, useState } from 'react';
import type { MessageInfo } from 'tuikit-atomicx-react/chat';
import {
  MessageStatus,
  MessageType,
  useLoginStore,
} from 'tuikit-atomicx-react/chat';
import { TUIMessageBox, TUIToast } from '../../../base';
import { t } from '../../../base/i18n';
import { formatTimestampToTime } from '../../../utils/formatTimestamp';
import { emojiBaseUrl, emojiUrlMap } from './emoji';
import { getSendErrorMessage } from './getSendErrorMessage';
import { useChatComposer } from './useChatComposer';
import type { MessageAction } from './useMessageActions';
import { CHAT_SCROLL_TICK_KEY } from './useMessageList';
import { useMessageOverlay } from './useMessageOverlay';
import { useSenderProfile } from './useSenderName';

export interface ChatMessageProps {
  readonly message: MessageInfo;
  readonly actions: readonly MessageAction[];
  readonly compact: boolean;
}

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

export function useChatMessage(props: ChatMessageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const chatScrollTick = useContext(CHAT_SCROLL_TICK_KEY);
  const scrollTickFirstRunRef = useRef(true);
  useEffect(() => {
    if (scrollTickFirstRunRef.current) {
      scrollTickFirstRunRef.current = false;
      return;
    }
    setMenuOpen(false);
  }, [chatScrollTick]);
  const resolveProfile = useSenderProfile();
  const { getChat } = useLoginStore();
  const overlay = useMessageOverlay();
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;
  const composer = useChatComposer();
  const [lastTextPayload, setLastTextPayload] = useState(() => {
    const text = props.message.messageType === MessageType.Text
      ? (props.message.messagePayload as { text?: string })?.text
      : '';
    return text ?? '';
  });
  const retryLockedRef = useRef(false);
  const messageRef = useRef(props.message);
  messageRef.current = props.message;

  const statusFirstRunRef = useRef(true);
  useEffect(() => {
    if (statusFirstRunRef.current) {
      statusFirstRunRef.current = false;
      return;
    }
    const { status } = messageRef.current;
    if (status !== MessageStatus.Recalled && status !== MessageStatus.Deleted) return;
    overlayRef.current?.clear(messageRef.current.id);
  }, [props.message.status]);

  const textPayload = props.message.messageType === MessageType.Text
    ? (props.message.messagePayload as { text?: string })?.text
    : '';
  useEffect(() => {
    // Keep the raw emoji keys so re-edit can restore the original draft.
    if (textPayload) {
      setLastTextPayload(textPayload);
    }
  }, [textPayload]);

  const { message } = props;
  const senderProfile = resolveProfile(message);
  const senderName = senderProfile.name;
  const senderAvatar = senderProfile.avatarUrl;
  const displayStatus = overlay?.statusOf(message) ?? message.status;
  const isRecalled = displayStatus === MessageStatus.Recalled;
  const isFailed = displayStatus === MessageStatus.SendFail;
  const isSending = (
    displayStatus === MessageStatus.Sending || displayStatus === MessageStatus.InitStatus
  );
  const recalledText = message.isSentBySelf
    ? t('RoomChat.you_recalled')
    : t('RoomChat.recalled', { name: senderName });
  const canReedit = (
    message.isSentBySelf
    && isRecalled
    && Boolean(lastTextPayload)
  );
  const displayTimestamp = overlay?.timestampOf(message) ?? message.timestamp;
  const timeText = formatTimestampToTime(displayTimestamp, 'HH:mm');
  const messageForActions = (
    displayStatus === message.status && displayTimestamp === message.timestamp
  )
    ? message
    : { ...message, status: displayStatus, timestamp: displayTimestamp } as MessageInfo;
  const visibleActions = props.actions.filter((action) => {
    if (typeof action.visible === 'function') return action.visible(messageForActions);
    return action.visible !== false;
  });
  let bubbleKind: 'text' | 'file' | 'image' | 'video' | 'unknown';
  switch (message.messageType) {
    case MessageType.Text:
      bubbleKind = 'text';
      break;
    case MessageType.File:
      bubbleKind = 'file';
      break;
    case MessageType.Image:
      bubbleKind = 'image';
      break;
    case MessageType.Video:
      bubbleKind = 'video';
      break;
    default:
      bubbleKind = 'unknown';
  }
  const textParts = splitTextWithEmoji(
    message.messageType === MessageType.Text
      ? (message.messagePayload as { text?: string })?.text ?? ''
      : '',
  );
  const fileName = (
    message.messageType === MessageType.File
      ? (message.messagePayload as { fileName?: string })?.fileName || t('RoomChat.file_fallback')
      : t('RoomChat.file_fallback')
  );
  const fileSizeText = message.messageType === MessageType.File
    ? formatFileSize((message.messagePayload as { fileSize?: number })?.fileSize)
    : '';
  const imagePayload = message.messagePayload as {
    thumbImageURL?: string;
    largeImageURL?: string;
    originalImageURL?: string;
  };
  const imageThumb = message.messageType !== MessageType.Image
    ? ''
    : imagePayload.thumbImageURL || imagePayload.largeImageURL || imagePayload.originalImageURL || '';
  const imageOpenUrl = message.messageType !== MessageType.Image
    ? ''
    : imagePayload.originalImageURL || imagePayload.largeImageURL || imagePayload.thumbImageURL || '';
  const videoPayload = message.messagePayload as {
    videoURL?: string;
    videoSnapshotURL?: string;
    videoDuration?: number;
  };
  const videoOpenUrl = message.messageType === MessageType.Video
    ? videoPayload.videoURL || ''
    : '';
  const videoPoster = message.messageType === MessageType.Video
    ? videoPayload.videoSnapshotURL || ''
    : '';
  const videoDurationText = message.messageType === MessageType.Video
    ? formatDuration(videoPayload.videoDuration)
    : '';
  const fallbackText = t('RoomChat.unsupported');

  function reeditRecalled() {
    composer?.fillDraft(lastTextPayload);
  }

  function onActionCommand(command: string | number) {
    const action = visibleActions.find(item => item.key === command);
    const result = action?.onClick?.(message);
    if (result == null || (action?.key !== 'recall' && action?.key !== 'delete')) return;
    Promise.resolve(result)
      .then(() => {
        setMenuOpen(false);
        if (action.key === 'recall') {
          overlayRef.current?.patch(message.id, { status: MessageStatus.Recalled });
          return;
        }
        overlayRef.current?.patch(message.id, { status: MessageStatus.Deleted });
      })
      .catch(() => undefined);
  }

  async function downloadFile() {
    if (message.messageType !== MessageType.File) return;
    const url = (message.messagePayload as { fileURL?: string }).fileURL;
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('download failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      TUIToast.error(t('RoomChat.download_failed'));
    }
  }

  async function retrySend() {
    if (retryLockedRef.current || !isFailed) return;
    retryLockedRef.current = true;
    try {
      const confirmed = await TUIMessageBox.confirm({
        title: t('RoomChat.resend_title'),
        message: t('RoomChat.resend_confirm_message'),
        confirmText: t('RoomChat.resend_confirm'),
        cancelText: t('RoomChat.resend_cancel'),
        closable: false,
      });
      if (!confirmed) return;
      const raw = (message as MessageInfo & { _rawSDK?: unknown })._rawSDK;
      await getChat()?.resendMessage(raw);
    } catch (error) {
      TUIToast.error(getSendErrorMessage(error));
    } finally {
      retryLockedRef.current = false;
    }
  }

  return {
    isRecalled,
    canReedit,
    recalledText,
    senderAvatar,
    senderName,
    timeText,
    isFailed,
    isSending,
    menuOpen,
    setMenuOpen,
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
    reeditRecalled,
    retrySend,
    onActionCommand,
    downloadFile,
  };
}
