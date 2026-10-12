<template>
  <div
    class="chat-message"
    :class="{
      'chat-message-recalled': isRecalled,
      'chat-message-self': !isRecalled && message.isSentBySelf,
      'chat-message-compact': !isRecalled && compact,
    }"
  >
    <template v-if="isRecalled">
      <span>{{ recalledText }}</span>
      <button
        v-if="canReedit"
        type="button"
        class="chat-message-reedit"
        @click="reeditRecalled"
      >
        {{ t('RoomChat.reedit') }}
      </button>
    </template>
    <template v-else>
      <TUIAvatar
        v-if="!compact"
        class="chat-message-avatar"
        :src="senderAvatar"
        :alt="senderName"
        :size="32"
      />
      <span
        v-else
        class="chat-message-avatar-spacer"
        aria-hidden="true"
      />
      <div class="chat-message-body">
        <div v-if="!compact" class="chat-message-meta">
          <span class="chat-message-name">{{ senderName }}</span>
          <span v-if="timeText" class="chat-message-time">{{ timeText }}</span>
        </div>
        <div class="chat-message-row">
          <span
            v-if="message.isSentBySelf"
            class="chat-message-aside"
          >
            <button
              v-if="isFailed"
              type="button"
              class="chat-message-fail"
              :aria-label="t('RoomChat.retry')"
              @click.stop="retrySend"
            >
              <IconFail :size="16" />
            </button>
            <span v-else-if="isSending" class="chat-message-status">
              <IconLoading :size="14" spin />
            </span>
          </span>
          <div class="chat-message-hit">
            <TUIDropdown
              :open="menuOpen"
              :disabled="visibleActions.length === 0"
              :placement="message.isSentBySelf ? 'bottom-end' : 'bottom-start'"
              :offset="2"
              :virtual-reference="useVirtualRef ? { x: menuX, y: menuY } : null"
              @command="onActionCommand"
              @update:open="menuOpen = $event"
            >
              <div
                class="chat-message-bubble"
                :class="`chat-message-bubble-${bubbleKind}`"
                @contextmenu.prevent="openMenu($event)"
                @click="onBubbleClick"
              >
                <span v-if="bubbleKind === 'text'" class="chat-message-text">
                  <template v-for="(part, index) in textParts" :key="index">
                    <img
                      v-if="part.src"
                      class="chat-message-emoji"
                      :src="part.src"
                      alt=""
                    >
                    <span v-else>{{ part.text }}</span>
                  </template>
                </span>
                <div
                  v-else-if="bubbleKind === 'file'"
                  class="chat-file"
                  @click.stop
                >
                  <span class="chat-file-icon"><IconFile :size="20" /></span>
                  <span class="chat-file-meta">
                    <span class="chat-file-name">{{ fileName }}</span>
                    <span v-if="fileSizeText" class="chat-file-size">{{ fileSizeText }}</span>
                  </span>
                  <button
                    type="button"
                    class="chat-file-download"
                    :aria-label="t('RoomChat.download')"
                    @click.stop="downloadFile"
                  >
                    <IconDownload :size="14" />
                  </button>
                </div>
                <button
                  v-else-if="bubbleKind === 'image'"
                  type="button"
                  class="chat-image"
                  @click.stop="openPreview"
                >
                  <img
                    class="chat-image-img"
                    :src="imageThumb"
                    :alt="t('RoomChat.image_alt')"
                  >
                </button>
                <button
                  v-else-if="bubbleKind === 'video'"
                  type="button"
                  class="chat-video"
                  :style="videoBoxStyle"
                  :aria-label="t('RoomChat.play_video')"
                  @click.stop="openPreview"
                >
                  <img
                    v-if="videoPoster"
                    class="chat-video-poster"
                    :src="videoPoster"
                    alt=""
                  >
                  <span class="chat-video-play" aria-hidden="true">
                    <IconChatVideo :size="18" />
                  </span>
                  <span v-if="videoDurationText" class="chat-video-duration">{{ videoDurationText }}</span>
                </button>
                <button
                  v-else-if="bubbleKind === 'audio'"
                  type="button"
                  class="chat-audio"
                  :aria-label="t('RoomChat.play_audio')"
                  @click.stop="openPreview"
                >
                  <span class="chat-audio-icon"><IconSpeaker :size="20" /></span>
                  <span class="chat-audio-meta">
                    <span class="chat-audio-name">{{ t('RoomChat.audio') }}</span>
                    <span v-if="audioDurationText" class="chat-audio-duration">{{ audioDurationText }}</span>
                  </span>
                </button>
                <span v-else class="chat-message-text">{{ fallbackText }}</span>
              </div>
              <template #menu>
                <div class="chat-message-menu">
                  <TUIDropdownItem
                    v-for="action in visibleActions"
                    :key="action.key"
                    :command="action.key"
                    :danger="action.danger"
                  >
                    <IconCopy v-if="action.key === 'copy'" :size="16" />
                    <IconRecall v-else-if="action.key === 'recall'" :size="16" />
                    <IconDelete v-else-if="action.key === 'delete'" :size="16" />
                    <span>{{ action.label }}</span>
                  </TUIDropdownItem>
                </div>
              </template>
            </TUIDropdown>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import {
  MessageStatus,
  MessageType,
  useLoginStore,
} from 'tuikit-atomicx-vue3/chat';
import {
  TUIAvatar,
  TUIDropdown,
  TUIDropdownItem,
  IconChatVideo,
  IconCopy,
  IconDelete,
  IconDownload,
  IconFail,
  IconFile,
  IconLoading,
  IconRecall,
  IconSpeaker,
  TUIMessageBox,
  TUIToast,
} from '../../../base';
import { t } from '../../../base/i18n';
import { emojiBaseUrl, emojiUrlMap } from './emoji';
import { getSendErrorMessage } from './getSendErrorMessage';
import type { ChatMediaPreview } from './mediaPreview';
import { ResendUnavailableError, resendMessageInPlace } from './resendMessage';
import { useChatComposer } from './useChatComposer';
import type { MessageAction } from './useMessageActions';
import { useMessageOverlay } from './useMessageOverlay';
import { useSenderProfile } from './useSenderName';

const props = withDefaults(defineProps<{
  message: MessageInfo;
  actions?: MessageAction[];
  channel?: string;
  compact?: boolean;
}>(), {
  actions: () => [],
  channel: 'default',
  compact: false,
});

const emit = defineEmits<{
  preview: [payload: ChatMediaPreview];
}>();

const menuOpen = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const useVirtualRef = ref(false);
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

watch(() => props.message.status, (status) => {
  if (status !== MessageStatus.Recalled && status !== MessageStatus.Deleted) return;
  overlay?.clear(props.message.id);
});
watch(
  () => (props.message.messagePayload as { text?: string })?.text,
  (text) => {
    // Keep the raw emoji keys so re-edit can restore the original draft.
    if (props.message.messageType === MessageType.Text && text) {
      lastTextPayload.value = text;
    }
  },
  { immediate: true },
);

const senderProfile = computed(() => resolveProfile(props.message));
const senderName = computed(() => senderProfile.value.name);
const senderAvatar = computed(() => senderProfile.value.avatarUrl);
const displayStatus = computed(() => {
  overlay?.overlays.size;
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
const recalledPayloadText = computed(() => lastTextPayload.value);
const canReedit = computed(() => (
  props.message.isSentBySelf
  && isRecalled.value
  && Boolean(recalledPayloadText.value)
));
const displayTimestamp = computed(() => overlay?.timestampOf(props.message) ?? props.message.timestamp);
const timeText = computed(() => {
  const date = displayTimestamp.value;
  if (!date) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
});
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
    case MessageType.Audio:
      return 'audio';
    default:
      return 'unknown';
  }
});
const textParts = computed(() => splitTextWithEmoji(
  (props.message.messagePayload as { text?: string })?.text ?? '',
));
const filePayload = computed(() => props.message.messagePayload as {
  fileName?: string;
  fileSize?: number;
  fileURL?: string;
});
const fileName = computed(() => filePayload.value.fileName || t('RoomChat.file_fallback'));
const fileSizeText = computed(() => formatFileSize(filePayload.value.fileSize));
const imagePayload = computed(() => props.message.messagePayload as {
  thumbImageURL?: string;
  largeImageURL?: string;
  originalImageURL?: string;
});
const imageThumb = computed(() => (
  imagePayload.value.thumbImageURL
  || imagePayload.value.largeImageURL
  || imagePayload.value.originalImageURL
  || ''
));
const imagePreview = computed(() => (
  imagePayload.value.originalImageURL
  || imagePayload.value.largeImageURL
  || imageThumb.value
));
const videoPayload = computed(() => props.message.messagePayload as {
  videoURL?: string;
  videoSnapshotURL?: string;
  videoSnapshotWidth?: number;
  videoSnapshotHeight?: number;
  videoDuration?: number;
});
const videoUrl = computed(() => videoPayload.value.videoURL || '');
const videoPoster = computed(() => videoPayload.value.videoSnapshotURL || '');
const videoDurationText = computed(() => formatDuration(videoPayload.value.videoDuration));
const videoBoxStyle = computed(() => {
  const maxWidth = 200;
  const maxHeight = 112;
  const minHeight = 64;
  const width = videoPayload.value.videoSnapshotWidth || 0;
  const height = videoPayload.value.videoSnapshotHeight || 0;
  const isPlaceholder = width === 200 && height === 200;
  if (width > 0 && height > 0 && !isPlaceholder) {
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    return {
      width: `${Math.round(width * scale)}px`,
      height: `${Math.max(minHeight, Math.round(height * scale))}px`,
    };
  }
  return {
    width: `${maxWidth}px`,
    height: `${maxHeight}px`,
  };
});
const audioPayload = computed(() => props.message.messagePayload as {
  audioURL?: string;
  audioDuration?: number;
});
const audioUrl = computed(() => audioPayload.value.audioURL || '');
const audioDurationText = computed(() => formatDuration(audioPayload.value.audioDuration));
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

function openPreview() {
  const kind = bubbleKind.value;
  if (kind === 'image') {
    if (!imagePreview.value) {
      TUIToast.error(t('RoomChat.media_unavailable'));
      return;
    }
    emit('preview', { kind, src: imagePreview.value });
    return;
  }
  if (kind === 'video') {
    if (!videoUrl.value) {
      TUIToast.error(t('RoomChat.media_unavailable'));
      return;
    }
    emit('preview', { kind, src: videoUrl.value, poster: videoPoster.value || undefined });
    return;
  }
  if (kind === 'audio') {
    if (!audioUrl.value) {
      TUIToast.error(t('RoomChat.media_unavailable'));
      return;
    }
    emit('preview', { kind, src: audioUrl.value });
  }
}

function reeditRecalled() {
  const text = recalledPayloadText.value;
  if (!text) return;
  composer?.fillDraft(text);
}

function openMenu(event?: Event) {
  if (!visibleActions.value.length) return;
  if (event && 'clientX' in event) {
    menuX.value = (event as MouseEvent).clientX;
    menuY.value = (event as MouseEvent).clientY;
    useVirtualRef.value = true;
  } else {
    useVirtualRef.value = false;
  }
  menuOpen.value = true;
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

function onBubbleClick() {
  if (
    bubbleKind.value === 'image'
    || bubbleKind.value === 'video'
    || bubbleKind.value === 'audio'
    || bubbleKind.value === 'file'
  ) return;
  openMenu();
}

async function downloadFile() {
  const url = filePayload.value.fileURL;
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
    const { message } = props;
    overlay?.patch(message.id, { status: MessageStatus.Sending });
    try {
      await resendMessageInPlace(getChat(), message);
      overlay?.patch(message.id, {
        status: MessageStatus.SendSuccess,
        timestamp: new Date(),
      });
    } catch (error) {
      overlay?.patch(message.id, { status: MessageStatus.SendFail });
      TUIToast.error(
        error instanceof ResendUnavailableError
          ? t('RoomChat.resend_media')
          : getSendErrorMessage(error),
      );
    }
  } finally {
    retryLocked = false;
  }
}
</script>

<style scoped lang="scss">
.chat-message {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: flex-start;
  width: 100%;
  padding: 10px 0 0;
}

.chat-message-self {
  flex-direction: row-reverse;
}

.chat-message-compact {
  padding-top: 4px;
}

.chat-message-avatar,
.chat-message-avatar-spacer {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
}

.chat-message-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  min-width: 0;
  max-width: calc(100% - 40px);
}

.chat-message-self .chat-message-body {
  align-items: flex-end;
}

.chat-message-recalled {
  gap: 0;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--rk-text-tertiary);
}

.chat-message-reedit {
  padding: 0 5px;
  font: inherit;
  font-size: inherit;
  line-height: inherit;
  color: var(--rk-info);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.chat-message-meta {
  display: flex;
  gap: 6px;
  align-items: baseline;
  max-width: 100%;
}

.chat-message-name {
  max-width: 200px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-message-time {
  font-size: 11px;
  line-height: 16px;
  color: var(--rk-text-tertiary);
}

.chat-message-row {
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  gap: 4px;
  align-items: center;
  width: 100%;
  max-width: 100%;
}

.chat-message-hit {
  min-width: 0;
  max-width: 100%;
}

.chat-message-aside {
  display: inline-flex;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.chat-message-self .chat-message-hit {
  max-width: calc(100% - 20px);
}

.chat-message-hit :deep(.rk-dropdown-anchor) {
  display: inline-flex;
  max-width: 100%;
  vertical-align: top;
}

.chat-message-self .chat-message-row {
  justify-content: flex-end;
}

.chat-message-status {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--rk-text-tertiary);
}

.chat-message-fail {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  color: var(--rk-danger);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.chat-message-bubble {
  display: inline-block;
  width: fit-content;
  min-width: 0;
  max-width: 100%;
  text-align: left;
}

.chat-message-bubble-text,
.chat-message-bubble-unknown {
  padding: 8px 12px;
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
  border-radius: 12px;
  border-top-left-radius: 4px;
}

.chat-message-self .chat-message-bubble-text,
.chat-message-self .chat-message-bubble-unknown {
  color: var(--rk-on-accent);
  background: var(--rk-brand);
  border-radius: 12px;
  border-top-right-radius: 4px;
}

.chat-message-text {
  font-size: 13px;
  line-height: 1.5;
  color: inherit;
  word-break: break-word;
  white-space: pre-wrap;
}

.chat-message-emoji {
  width: 20px;
  height: 20px;
  margin: 0 1px;
  vertical-align: text-bottom;
}

.chat-file {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 180px;
  max-width: 240px;
  padding: 10px 12px;
  color: inherit;
  text-align: left;
  background: var(--rk-bg-raised);
  border: 1px solid var(--rk-border-strong);
  border-radius: 8px;
}

.chat-file-icon {
  display: inline-flex;
  color: var(--rk-text-secondary);
}

.chat-file-meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.chat-file-download {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  margin-left: auto;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  opacity: 0;
  pointer-events: none;
}

.chat-file:hover .chat-file-download {
  opacity: 1;
  pointer-events: auto;
}

.chat-file-name {
  overflow: hidden;
  font-size: 13px;
  line-height: 18px;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-file-size {
  font-size: 12px;
  line-height: 16px;
  color: var(--rk-text-tertiary);
}

.chat-message-bubble-image,
.chat-message-bubble-video {
  max-width: 200px;
}

.chat-image,
.chat-video {
  position: relative;
  display: block;
  max-width: 200px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: var(--rk-bg-muted);
  border: 0;
  border-radius: 8px;
}

.chat-image-img {
  display: block;
  width: auto;
  max-width: 200px;
  height: auto;
  max-height: 200px;
  object-fit: contain;
}

.chat-video {
  width: 200px;
  height: 112px;
}

.chat-video-poster {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-video-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rk-white);
  pointer-events: none;

  &::before {
    position: absolute;
    width: 36px;
    height: 36px;
    content: '';
    background: color-mix(in srgb, black 45%, transparent);
    border-radius: 50%;
  }

  :deep(svg) {
    position: relative;
    z-index: 1;
  }
}

.chat-video-duration {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 1px 5px;
  font-size: 11px;
  line-height: 14px;
  color: var(--rk-white);
  background: color-mix(in srgb, black 45%, transparent);
  border-radius: 4px;
}

.chat-audio {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 160px;
  max-width: 240px;
  padding: 10px 12px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
}

.chat-audio-icon {
  display: inline-flex;
  color: var(--rk-text-secondary);
}

.chat-audio-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.chat-audio-name {
  font-size: 13px;
  line-height: 18px;
  color: var(--rk-text-primary);
}

.chat-audio-duration {
  font-size: 12px;
  line-height: 16px;
  color: var(--rk-text-tertiary);
}
</style>

<style lang="scss">
.chat-message-menu .rk-dropdown-item {
  gap: 8px;
}

.chat-message-menu .rk-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}
</style>
