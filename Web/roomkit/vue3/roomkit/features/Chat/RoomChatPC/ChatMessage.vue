<template>
  <div
    class="chat-message"
    :class="{
      'chat-message-mobile': mobile,
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
        :size="mobile ? 28 : 32"
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
              contextmenu
              @command="onActionCommand"
              @update:open="menuOpen = $event"
            >
              <div
                class="chat-message-bubble"
                :class="`chat-message-bubble-${bubbleKind}`"
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
                  <span class="chat-file-icon">
                    <IconFileMobile v-if="mobile" :size="16" />
                    <IconFile v-else :size="20" />
                  </span>
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
                <MediaPreview
                  v-else-if="bubbleKind === 'image'"
                  :src="imageOpenUrl"
                  :poster="imageThumb"
                  :mobile="mobile"
                />
                <MediaPreview
                  v-else-if="bubbleKind === 'video'"
                  kind="video"
                  :src="videoOpenUrl"
                  :poster="videoPoster"
                  :duration="videoDurationText"
                  :mobile="mobile"
                />
                <span v-else class="chat-message-text">{{ fallbackText }}</span>
              </div>
              <template #menu>
                <div class="chat-message-menu" :class="{ 'chat-message-menu-mobile': mobile }">
                  <TUIDropdownItem
                    v-for="action in visibleActions"
                    :key="action.key"
                    :command="action.key"
                    :danger="action.danger"
                  >
                    <IconCopy v-if="action.key === 'copy'" :size="mobile ? 14 : 16" />
                    <IconRecall v-else-if="action.key === 'recall'" :size="mobile ? 14 : 16" />
                    <IconDelete v-else-if="action.key === 'delete'" :size="mobile ? 14 : 16" />
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
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import {
  TUIAvatar,
  TUIDropdown,
  TUIDropdownItem,
  IconCopy,
  IconDelete,
  IconDownload,
  IconFail,
  IconFile,
  IconFileMobile,
  IconLoading,
  IconRecall,
  t,
} from '../../../base';
import MediaPreview from './MediaPreview.vue';
import { useChatMessage } from './useChatMessage';
import type { MessageAction } from './useMessageActions';

const props = withDefaults(defineProps<{
  message: MessageInfo;
  actions?: MessageAction[];
  compact?: boolean;
  mobile?: boolean;
}>(), {
  actions: () => [],
  compact: false,
  mobile: false,
});

const {
  isRecalled,
  canReedit,
  recalledText,
  senderAvatar,
  senderName,
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
  reeditRecalled,
  retrySend,
  onActionCommand,
  downloadFile,
} = useChatMessage(props);
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
  font-size: var(--rk-fs-sm);
  line-height: 16px;
  color: var(--rk-text-tertiary);
}

.chat-message-reedit {
  padding: 0 5px;
  font: inherit;
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
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  line-height: 16px;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-message-time {
  font-size: var(--rk-fs-sm);
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
  color: var(--rk-bubble-other-fg);
  background: var(--rk-bubble-other-bg);
  border-radius: 12px;
  border-top-left-radius: 4px;
}

.chat-message-self .chat-message-bubble-text,
.chat-message-self .chat-message-bubble-unknown {
  color: var(--rk-bubble-self-fg);
  background: var(--rk-bubble-self-bg);
  border-radius: 12px;
  border-top-right-radius: 4px;
}

.chat-message-text {
  font-size: var(--rk-fs-md);
  line-height: 1.5;
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
  pointer-events: none;
  cursor: pointer;
  background: transparent;
  border: 0;
  opacity: 0;
}

.chat-message-mobile .chat-file-download {
  width: 22px;
  height: 22px;
  pointer-events: auto;
  opacity: 1;
}

.chat-file:hover .chat-file-download {
  pointer-events: auto;
  opacity: 1;
}

.chat-file-name {
  overflow: hidden;
  font-size: var(--rk-fs-md);
  line-height: 18px;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-file-size {
  font-size: var(--rk-fs-sm);
  line-height: 16px;
  color: var(--rk-text-tertiary);
}

.chat-message-bubble-image,
.chat-message-bubble-video {
  max-width: 200px;
}

.chat-message-mobile {
  min-width: 0;
  padding: 0 0 14px;
}

.chat-message-mobile.chat-message-self {
  margin-left: auto;
}

.chat-message-mobile.chat-message-compact {
  padding-top: 0;
  padding-bottom: 8px;
}

.chat-message-mobile .chat-message-avatar,
.chat-message-mobile .chat-message-avatar-spacer {
  flex-basis: 28px;
  width: 28px;
  height: 28px;
}

.chat-message-mobile .chat-message-body {
  flex: 1 1 auto;
  max-width: calc(85% - 36px);
}

.chat-message-mobile.chat-message-recalled {
  width: 100%;
  max-width: 100%;
  margin-left: 0;
}

.chat-message-mobile .chat-message-meta {
  gap: 8px;
  margin-bottom: 2px;
}

.chat-message-mobile .chat-message-name {
  font-weight: 400;
  color: var(--rk-text-tertiary);
}

.chat-message-mobile .chat-message-row {
  flex: none;
  width: fit-content;
}

.chat-message-mobile .chat-message-hit {
  flex: 0 1 auto;
  max-width: none;
}

.chat-message-mobile.chat-message-self .chat-message-hit {
  max-width: none;
}

.chat-message-mobile .chat-message-hit :deep(.rk-dropdown-anchor) {
  display: flex;
  min-width: 0;
  max-width: none;
}

.chat-message-mobile .chat-message-bubble {
  flex: 0 1 auto;
  width: auto;
  max-width: none;
}

.chat-message-mobile .chat-message-bubble-text,
.chat-message-mobile .chat-message-bubble-unknown {
  box-sizing: content-box;
  padding: 6px 10px;
  color: var(--rk-h5-bubble-other-fg);
  background: var(--rk-h5-bubble-other-bg);
  border-radius: 12px;
}

.chat-message-mobile.chat-message-self .chat-message-bubble-text,
.chat-message-mobile.chat-message-self .chat-message-bubble-unknown {
  color: var(--rk-h5-bubble-self-fg);
  background: var(--rk-h5-bubble-self-bg);
  border-radius: 12px;
}

.chat-message-mobile .chat-message-text {
  line-height: 1.45;
  word-break: normal;
  overflow-wrap: break-word;
}

.chat-message-mobile .chat-file {
  gap: 10px;
  width: 180px;
  min-width: 180px;
  max-width: 180px;
  padding: 8px 10px;
  color: var(--rk-text-primary);
  border-radius: 12px;
}

.chat-message-mobile .chat-file-icon {
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--rk-bg-hover);
  border-radius: 8px;
}

.chat-message-mobile .chat-file-name {
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  line-height: 1.3;
}

.chat-message-mobile .chat-file-size {
  line-height: 1.2;
}

.chat-message-mobile .chat-message-bubble-image,
.chat-message-mobile .chat-message-bubble-video {
  max-width: 190px;
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

.chat-message-menu-mobile .rk-dropdown-item {
  min-height: 32px;
  padding: 6px 9px;
  font-size: var(--rk-fs-sm);
  border-radius: var(--rk-radius-sm);
}

.chat-message-menu-mobile .rk-icon {
  width: 14px;
  height: 14px;
}
</style>
