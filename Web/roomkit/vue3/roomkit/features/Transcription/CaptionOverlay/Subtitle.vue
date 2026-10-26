<template>
  <div
    v-show="isPanelVisible"
    class="cap-panel"
    :class="{
      'cap-panel-hint': isPlaceholderVisible,
      'cap-panel-empty': isEmptyPinned,
    }"
    :style="captionCssVars"
  >
    <div v-if="isPlaceholderVisible" class="cap-placeholder">
      <span class="cap-placeholder-text">{{ placeholderText }}</span>
    </div>
    <div v-else-if="displayMessages.length > 0" class="cap-list">
      <TransitionGroup
        name="cap-row"
        tag="div"
        class="cap-row-group"
      >
        <div
          v-for="item in displayMessages"
          :key="item.speakerUserId"
          class="cap-row-shell"
        >
          <div class="cap-row">
            <TUIAvatar
              class="cap-avatar"
              :src="item.avatarUrl"
              :alt="item.speakerName"
              :size="avatarSize"
            />
            <div class="cap-body">
              <div class="cap-speaker-row">
                <span class="cap-speaker" :title="item.speakerName">
                  {{ item.speakerName }}
                </span>
                <span
                  v-if="!item.isCompleted"
                  class="cap-live"
                  :aria-label="t('ASRTools.Recognizing')"
                >
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div
                class="cap-line cap-line-primary"
                :style="{ maxHeight: `${item.maxLines * primaryLineHeight}px` }"
              >
                <span class="cap-line-inner">
                  <CaptionStreamText
                    :text="item.source"
                    :is-completed="item.isCompleted"
                    show-caret
                  />
                </span>
              </div>
              <div
                class="cap-trans"
                :class="{ 'is-open': isTranslationShown && Boolean(item.translation) }"
                :aria-hidden="!isTranslationShown || !item.translation"
              >
                <div class="cap-trans-clip">
                  <div
                    class="cap-line cap-line-secondary"
                    :style="{ maxHeight: `${item.maxLines * secondaryLineHeight}px` }"
                  >
                    <span class="cap-line-inner">
                      <CaptionStreamText
                        :text="item.translation"
                        :is-completed="item.isCompleted"
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { RealtimeTranscriberEvent, useAITranscriberState } from 'tuikit-atomicx-vue3/room';
import { TUIAvatar, t } from '../../../base';
import {
  CAPTION_FONT_SIZE_PC,
  DEFAULT_CAPTION_FONT_SIZE,
  MAX_CAPTION_BUFFER_CHARS,
  MAX_CAPTION_LINES,
  MAX_CONCURRENT_SPEAKERS,
  SPEAKER_ROW_TRANSITION_MS,
  SUBTITLE_CLEAR_DELAY_MS,
} from '../constants';
import { getDisplayAvatar, getDisplayName, getRecordLines, joinCaptionText } from '../display';
import { useSubtitleViewState } from '../useSubtitleViewState';
import CaptionStreamText from './CaptionStreamText.vue';
import type { CaptionDisplayMode, CaptionFontSize } from '../constants';
import type { RealtimeTranscriberEventInfoMap, TranscriberMessage } from 'tuikit-atomicx-vue3/room';

const PRIMARY_LINE_HEIGHT_RATIO = 1.5;
const SECONDARY_LINE_HEIGHT_RATIO = 1.45;
const SECONDARY_SIZE_RATIO = 0.85;
const SPEAKER_SIZE_RATIO = 0.7;
const MIN_SECONDARY_FONT_SIZE = 12;
const MIN_SPEAKER_FONT_SIZE = 11;
const AVATAR_SIZE = 20;

const props = withDefaults(defineProps<{
  targetLanguage?: string;
  captionMode?: CaptionDisplayMode;
  fontSize?: CaptionFontSize;
  /** Keep the last captions on screen while settings are open. */
  pinned?: boolean;
  /** Override the one-shot intro copy (host stopped transcription). */
  placeholderKey?: string;
  /** Keep the placeholder on screen even after the intro flag has cleared. */
  forcePlaceholder?: boolean;
  /** Speaker avatar. H5 uses a smaller mark; the dock stays at 20. */
  avatarSize?: number;
}>(), {
  targetLanguage: '',
  captionMode: 'bilingual',
  fontSize: DEFAULT_CAPTION_FONT_SIZE,
  pinned: false,
  placeholderKey: 'ASRTools.SubtitlePlaceholder',
  forcePlaceholder: false,
  avatarSize: AVATAR_SIZE,
});

const { subscribeEvent, unsubscribeEvent } = useAITranscriberState();
const { enableHintVisible, hasCaptionMessages } = useSubtitleViewState();

interface SpeakerCaption {
  speakerUserId: string;
  messages: TranscriberMessage[];
  /** Stable row rank, assigned on first appearance and never updated. */
  slot: number;
}

let nextSpeakerSlot = 0;

const speakerCaptions = ref<Record<string, SpeakerCaption>>({});
const subtitleTimeout: { [key: string]: ReturnType<typeof setTimeout> } = {};

const primaryFontSize = computed(() => CAPTION_FONT_SIZE_PC[props.fontSize]);
const primaryLineHeight = computed(() => Math.round(primaryFontSize.value * PRIMARY_LINE_HEIGHT_RATIO));
const secondaryFontSize = computed(() => Math.max(
  MIN_SECONDARY_FONT_SIZE,
  Math.round(primaryFontSize.value * SECONDARY_SIZE_RATIO),
));
const secondaryLineHeight = computed(() => Math.round(secondaryFontSize.value * SECONDARY_LINE_HEIGHT_RATIO));
const captionCssVars = computed(() => {
  const speakerFontSize = Math.max(
    MIN_SPEAKER_FONT_SIZE,
    Math.round(primaryFontSize.value * SPEAKER_SIZE_RATIO),
  );
  return {
    '--cap-primary-size': `${primaryFontSize.value}px`,
    '--cap-primary-line': `${primaryLineHeight.value}px`,
    '--cap-secondary-size': `${secondaryFontSize.value}px`,
    '--cap-secondary-line': `${secondaryLineHeight.value}px`,
    '--cap-speaker-size': `${speakerFontSize}px`,
    '--cap-speaker-line': '18px',
    '--cap-avatar-size': `${props.avatarSize}px`,
    '--cap-row-duration': `${SPEAKER_ROW_TRANSITION_MS}ms`,
  };
});

const clearSubtitleTimeouts = () => {
  Object.values(subtitleTimeout).forEach((timeout) => {
    clearTimeout(timeout);
  });
  Object.keys(subtitleTimeout).forEach((speakerUserId) => {
    delete subtitleTimeout[speakerUserId];
  });
};

const isTranslationShown = computed(() => props.captionMode === 'bilingual');

const joinSpeakerLines = (messages: TranscriberMessage[]) => (
  messages.reduce((acc, message) => {
    const lines = getRecordLines(message, props.targetLanguage, 'bilingual');
    return {
      source: joinCaptionText(acc.source, lines.source),
      translation: joinCaptionText(acc.translation, lines.translation),
    };
  }, { source: '', translation: '' })
);

const getJoinedSourceLength = (messages: TranscriberMessage[]): number => (
  Array.from(joinSpeakerLines(messages).source).length
);

const trimSpeakerMessages = (messages: TranscriberMessage[]): TranscriberMessage[] => {
  const next = messages.slice();
  while (next.length > 1 && getJoinedSourceLength(next) > MAX_CAPTION_BUFFER_CHARS) {
    next.shift();
  }
  return next;
};

const resetSubtitleTimeout = (speakerUserId: string, message: TranscriberMessage) => {
  if (subtitleTimeout[speakerUserId]) {
    clearTimeout(subtitleTimeout[speakerUserId]);
  }
  if (props.pinned) {
    return;
  }
  subtitleTimeout[speakerUserId] = setTimeout(() => {
    const current = speakerCaptions.value[speakerUserId];
    const lastMessage = current?.messages[current.messages.length - 1];
    if (
      lastMessage?.segmentId === message.segmentId
      && lastMessage?.timestamp === message.timestamp
    ) {
      const nextCaptions = { ...speakerCaptions.value };
      delete nextCaptions[speakerUserId];
      speakerCaptions.value = nextCaptions;
    }
    delete subtitleTimeout[speakerUserId];
  }, SUBTITLE_CLEAR_DELAY_MS);
};

const onReceiveTranscriberMessageHandler = (
  eventInfo: RealtimeTranscriberEventInfoMap[RealtimeTranscriberEvent.onReceiveTranscriberMessage],
) => {
  const { message } = eventInfo;
  const { speakerUserId } = message;
  const current = speakerCaptions.value[speakerUserId];
  const messages = current ? current.messages.slice() : [];
  const existingIndex = messages.findIndex(item => item.segmentId === message.segmentId);
  if (existingIndex >= 0) {
    messages[existingIndex] = message;
  } else {
    messages.push(message);
  }

  speakerCaptions.value = {
    ...speakerCaptions.value,
    [speakerUserId]: {
      speakerUserId,
      messages: trimSpeakerMessages(messages),
      slot: current?.slot ?? nextSpeakerSlot++,
    },
  };
  resetSubtitleTimeout(speakerUserId, message);
};

onMounted(() => {
  subscribeEvent(
    RealtimeTranscriberEvent.onReceiveTranscriberMessage,
    onReceiveTranscriberMessageHandler as never,
  );
});

const displayMessages = computed(() => {
  const speakers = Object.values(speakerCaptions.value)
    .map((speaker) => {
      const lastMessage = speaker.messages[speaker.messages.length - 1];
      const { source, translation } = joinSpeakerLines(speaker.messages);
      return {
        speakerUserId: speaker.speakerUserId,
        slot: speaker.slot,
        timestamp: lastMessage?.timestamp ?? 0,
        speakerName: getDisplayName(speaker.speakerUserId),
        avatarUrl: getDisplayAvatar(speaker.speakerUserId),
        source,
        translation,
        isCompleted: Boolean(lastMessage?.isCompleted),
      };
    })
    .filter(item => Boolean(item.source));

  const visibleIds = new Set(
    [...speakers]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-MAX_CONCURRENT_SPEAKERS)
      .map(item => item.speakerUserId),
  );
  const visibleSpeakers = speakers
    .filter(item => visibleIds.has(item.speakerUserId))
    .sort((a, b) => a.slot - b.slot);

  return visibleSpeakers.map(item => ({
    ...item,
    maxLines: MAX_CAPTION_LINES,
  }));
});

const placeholderText = computed(() => t(props.placeholderKey));
const isPlaceholderVisible = computed(
  () => props.forcePlaceholder || (enableHintVisible.value && displayMessages.value.length === 0),
);
const isEmptyPinned = computed(
  () => props.pinned && displayMessages.value.length === 0 && !isPlaceholderVisible.value,
);
const isPanelVisible = computed(
  () => isPlaceholderVisible.value || displayMessages.value.length > 0 || props.pinned,
);

watch(displayMessages, (messages) => {
  hasCaptionMessages.value = messages.length > 0;
  if (messages.length > 0) {
    enableHintVisible.value = false;
  }
}, { immediate: true });

watch(() => props.pinned, (pinned) => {
  if (pinned) {
    clearSubtitleTimeouts();
    return;
  }
  Object.values(speakerCaptions.value).forEach((speaker) => {
    const lastMessage = speaker.messages[speaker.messages.length - 1];
    if (lastMessage) {
      resetSubtitleTimeout(speaker.speakerUserId, lastMessage);
    }
  });
});

onUnmounted(() => {
  unsubscribeEvent(
    RealtimeTranscriberEvent.onReceiveTranscriberMessage,
    onReceiveTranscriberMessageHandler as never,
  );
  clearSubtitleTimeouts();
});
</script>

<style scoped lang="scss">
.cap-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 13px 14px 12px;
  color: #fff;
  background: rgb(16 18 24 / 58%);
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 14px;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  --cap-action-reserve: 92px;
}

.cap-panel-hint {
  padding: 16px;
}

.cap-panel-empty {
  min-height: calc(var(--cap-primary-line) + 32px);
}

.cap-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--cap-primary-line);
  text-align: center;
}

.cap-placeholder-text {
  font-size: var(--cap-primary-size);
  line-height: var(--cap-primary-line);
}

.cap-list {
  min-width: 0;
}

.cap-row-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-width: 0;
}

.cap-row-shell {
  display: grid;
  grid-template-rows: 1fr;
  min-height: 0;
  overflow: hidden;
}

.cap-row-enter-active,
.cap-row-leave-active {
  transition:
    grid-template-rows var(--cap-row-duration, 0.24s) cubic-bezier(0.16, 1, 0.3, 1),
    opacity var(--cap-row-duration, 0.24s) cubic-bezier(0.16, 1, 0.3, 1),
    transform var(--cap-row-duration, 0.24s) cubic-bezier(0.16, 1, 0.3, 1),
    margin-bottom var(--cap-row-duration, 0.24s) cubic-bezier(0.16, 1, 0.3, 1);
}

.cap-row-enter-from,
.cap-row-leave-to {
  grid-template-rows: 0fr;
  margin-bottom: -9px;
  opacity: 0;
  transform: translateY(4px);
}

.cap-row-move {
  transition: transform var(--cap-row-duration, 0.24s) cubic-bezier(0.16, 1, 0.3, 1);
}

.cap-row {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  min-width: 0;
  min-height: 0;
}

.cap-avatar {
  flex: none;
  margin-top: 1px;
}

.cap-body {
  flex: 1;
  min-width: 0;
}

.cap-speaker-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 3px;
  min-width: 0;
}

.cap-row-group > .cap-row-shell:first-child .cap-speaker-row {
  padding-right: var(--cap-action-reserve, 0px);
}

.cap-speaker {
  min-width: 0;
  overflow: hidden;
  color: rgb(255 255 255 / 92%);
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cap-live {
  display: inline-flex;
  flex: none;
  gap: 3px;
  align-items: center;
}

.cap-live i {
  width: 3px;
  height: 3px;
  background: rgb(255 255 255 / 50%);
  border-radius: 50%;
  animation: cap-live-dot 1.4s ease-in-out infinite;
}

.cap-live i:nth-child(2) {
  animation-delay: 0.18s;
}

.cap-live i:nth-child(3) {
  animation-delay: 0.36s;
}

@keyframes cap-live-dot {
  0%,
  100% {
    opacity: 0.28;
    transform: translateY(0.75px);
  }

  50% {
    opacity: 1;
    transform: translateY(-0.75px);
  }
}

.cap-trans {
  display: grid;
  grid-template-rows: 0fr;
  min-height: 0;
  transition: grid-template-rows var(--cap-row-duration, 0.28s) ease;
}

.cap-trans.is-open {
  grid-template-rows: 1fr;
}

.cap-trans-clip {
  min-height: 0;
  overflow: hidden;
}

.cap-line {
  display: flex;
  align-items: flex-end;
  min-width: 0;
  overflow: hidden;
}

.cap-line-inner {
  width: 100%;
  overflow-wrap: break-word;
  word-break: normal;
  line-break: auto;
  white-space: pre-wrap;
}

.cap-line-primary {
  font-size: var(--cap-primary-size);
  line-height: var(--cap-primary-line);
}

.cap-line-secondary {
  margin-top: 3px;
  color: rgb(255 255 255 / 62%);
  font-size: var(--cap-secondary-size);
  line-height: var(--cap-secondary-line);
  opacity: 0;
  transition: opacity var(--cap-row-duration, 0.28s) ease;
}

.cap-trans.is-open .cap-line-secondary {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .cap-live i {
    animation: none;
  }
}
</style>
