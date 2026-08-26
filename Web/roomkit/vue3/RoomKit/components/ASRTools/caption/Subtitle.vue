<template>
  <div
    v-show="isPanelVisible"
    :class="['cap-panel', `cap-panel--${props.layout}`, {
      'cap-panel--hint': isPlaceholderVisible,
      'cap-panel--empty': isEmptyPinned,
    }]"
    :style="captionCssVars"
  >
    <div v-if="isPlaceholderVisible" class="cap-placeholder">
      <span class="cap-placeholder__text">{{ placeholderText }}</span>
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
            <Avatar
              class="cap-avatar"
              :src="item.avatarUrl"
              :size="avatarSize"
            />
            <div class="cap-body">
              <div class="cap-speaker" :title="item.speakerName">
                {{ item.speakerName }}
              </div>
              <div
                class="cap-line cap-line--primary"
                :style="{ maxHeight: `${item.maxLines * primaryLineHeight}px` }"
              >
                <span class="cap-line__inner">
                  <CaptionStreamText
                    :text="item.source"
                    :is-completed="item.isCompleted"
                    show-caret
                  />
                </span>
              </div>
              <!-- Text stays mounted so hide can collapse to 0fr instead of snapping.
                   Closed rows take no space; the dock grows from the bottom as they open. -->
              <div
                class="cap-trans"
                :class="{ 'is-open': isTranslationShown && Boolean(item.translation) }"
                :aria-hidden="!isTranslationShown || !item.translation"
              >
                <div class="cap-trans__clip">
                  <div
                    class="cap-line cap-line--secondary"
                    :style="{ maxHeight: `${item.maxLines * secondaryLineHeight}px` }"
                  >
                    <span class="cap-line__inner">
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
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar, RealtimeTranscriberEvent, useAITranscriberState } from 'tuikit-atomicx-vue3/room';
import {
  CAPTION_FONT_SIZE_H5,
  CAPTION_FONT_SIZE_PC,
  DEFAULT_CAPTION_FONT_SIZE,
  MAX_CAPTION_BUFFER_CHARS,
  MAX_CONCURRENT_SPEAKERS,
  MAX_LINES_MULTI_SPEAKER,
  MAX_LINES_SINGLE_SPEAKER,
  SPEAKER_ROW_TRANSITION_MS,
  SUBTITLE_CLEAR_DELAY_MS,

} from '../constants';
import { useSubtitleViewState } from '../useSubtitleViewState';
import { getDisplayAvatar, getDisplayName, getRecordLines, joinCaptionText } from '../utils/display';
import CaptionStreamText from './CaptionStreamText.vue';
import type { CaptionDisplayMode, CaptionFontSize } from '../constants';
import type { RealtimeTranscriberEventInfoMap, TranscriberMessage } from 'tuikit-atomicx-vue3/room';

/** Caption text is set on a 1.45 baseline grid so both lines share one rhythm. */
const LINE_HEIGHT_RATIO = 1.45;
/** The translation line is a size down from the source it supports. */
const SECONDARY_SIZE_RATIO = 0.78;
const SPEAKER_SIZE_RATIO = 0.7;
const MIN_SECONDARY_FONT_SIZE = 12;
const MIN_SPEAKER_FONT_SIZE = 11;
const AVATAR_SIZE_PC = 28;
const AVATAR_SIZE_H5 = 24;

const props = withDefaults(defineProps<{
  targetLanguage?: string;
  captionMode?: CaptionDisplayMode;
  fontSize?: CaptionFontSize;
  layout?: 'pc' | 'h5';
  /** Keep the last captions on screen while settings are open. */
  pinned?: boolean;
  /** Override the one-shot intro copy (e.g. host stopped transcription). */
  placeholderKey?: string;
  /** Keep the placeholder on screen even after the intro flag has cleared. */
  forcePlaceholder?: boolean;
}>(), {
  targetLanguage: '',
  captionMode: 'bilingual',
  fontSize: DEFAULT_CAPTION_FONT_SIZE,
  layout: 'pc',
  pinned: false,
  placeholderKey: 'ASRTools.SubtitlePlaceholder',
  forcePlaceholder: false,
});

const { subscribeEvent, unsubscribeEvent } = useAITranscriberState();
const { enableHintVisible, hasCaptionMessages } = useSubtitleViewState();
const { t } = useUIKit();

interface SpeakerCaption {
  speakerUserId: string;
  messages: TranscriberMessage[];
  /** Stable row rank, assigned on first appearance and never updated. */
  slot: number;
}

let nextSpeakerSlot = 0;

const speakerCaptions = ref<Record<string, SpeakerCaption>>({});
const subtitleTimeout: { [key: string]: ReturnType<typeof setTimeout> } = {};
/**
 * Last line budget assigned to each speaker. Concurrent speech locks
 * everyone to one line; the remaining speaker keeps that lock until they
 * speak again, so dropping a row does not suddenly reveal clipped history.
 */
const lineBudgetHold = ref<Record<string, number>>({});

const avatarSize = computed(() => (props.layout === 'h5' ? AVATAR_SIZE_H5 : AVATAR_SIZE_PC));
const primaryFontSize = computed(() => {
  const scale = props.layout === 'h5' ? CAPTION_FONT_SIZE_H5 : CAPTION_FONT_SIZE_PC;
  return scale[props.fontSize];
});
const primaryLineHeight = computed(() => Math.round(primaryFontSize.value * LINE_HEIGHT_RATIO));
const secondaryFontSize = computed(() => Math.max(
  MIN_SECONDARY_FONT_SIZE,
  Math.round(primaryFontSize.value * SECONDARY_SIZE_RATIO),
));
const secondaryLineHeight = computed(() => Math.round(secondaryFontSize.value * LINE_HEIGHT_RATIO));
const speakerFontSize = computed(() => Math.max(
  MIN_SPEAKER_FONT_SIZE,
  Math.round(primaryFontSize.value * SPEAKER_SIZE_RATIO),
));

const captionCssVars = computed(() => ({
  '--cap-primary-size': `${primaryFontSize.value}px`,
  '--cap-primary-line': `${primaryLineHeight.value}px`,
  '--cap-secondary-size': `${secondaryFontSize.value}px`,
  '--cap-secondary-line': `${secondaryLineHeight.value}px`,
  '--cap-speaker-size': `${speakerFontSize.value}px`,
  '--cap-speaker-line': `${Math.round(speakerFontSize.value * LINE_HEIGHT_RATIO)}px`,
  '--cap-avatar-size': `${avatarSize.value}px`,
  '--cap-row-duration': `${SPEAKER_ROW_TRANSITION_MS}ms`,
}));

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
    // Always keep the translation string so the slot can animate closed.
    // Clearing it with source-only mode snaps the dock height to zero.
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
  // An open settings popover is still "reading" the overlay, so the
  // line must stay until that UI is dismissed.
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
      const nextHold = { ...lineBudgetHold.value };
      delete nextHold[speakerUserId];
      lineBudgetHold.value = nextHold;
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
  // Same segment keeps streaming in place; a new segment is appended so the
  // overlay does not jump back to a blank line every time a sentence ends.
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
  syncLineBudget(speakerUserId);
  resetSubtitleTimeout(speakerUserId, message);
};

const syncLineBudget = (speakingUserId: string) => {
  const activeIds = Object.keys(speakerCaptions.value);
  if (activeIds.length > 1) {
    const nextHold: Record<string, number> = {};
    activeIds.forEach((id) => {
      nextHold[id] = MAX_LINES_MULTI_SPEAKER;
    });
    lineBudgetHold.value = nextHold;
    return;
  }
  lineBudgetHold.value = {
    ...lineBudgetHold.value,
    [speakingUserId]: MAX_LINES_SINGLE_SPEAKER,
  };
};

onMounted(() => {
  subscribeEvent(
    RealtimeTranscriberEvent.onReceiveTranscriberMessage,
    onReceiveTranscriberMessageHandler as any,
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

  // Recency only decides who stays on screen. Visual order stays frozen so a
  // speaker who goes quiet is not sorted to another row before they fade out.
  const visibleIds = new Set(
    [...speakers]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-MAX_CONCURRENT_SPEAKERS)
      .map(item => item.speakerUserId),
  );
  const visibleSpeakers = speakers
    .filter(item => visibleIds.has(item.speakerUserId))
    .sort((a, b) => a.slot - b.slot);

  // Concurrent speakers each get one line so the dock keeps a stable height.
  // After one drops out, keep the remaining speaker on that one-line budget
  // until they speak again — expanding immediately would un-clip old text.
  const isMultiSpeaker = visibleSpeakers.length > 1;

  return visibleSpeakers.map(item => ({
    ...item,
    maxLines: isMultiSpeaker
      ? MAX_LINES_MULTI_SPEAKER
      : (lineBudgetHold.value[item.speakerUserId] ?? MAX_LINES_SINGLE_SPEAKER),
  }));
});

const placeholderText = computed(() => t(props.placeholderKey));

// Shown only when the user just opened captions, or when a status line must
// replace the overlay (host stopped transcription). An empty running overlay
// hides the dock instead of repeating the intro disclaimer.
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
    onReceiveTranscriberMessageHandler as any,
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
  padding: 16px;
  color: var(--text-color-button);
  // Charcoal + hairline, not pure black: a 40% black wash disappears on dark video.
  background-color: rgb(28 28 32 / 66%);
  backdrop-filter: blur(3px);
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 16px;
}

.cap-panel--pc {
  // Overlay actions sit on the speaker row only; caption copy uses the full width.
  --cap-action-reserve: 152px;
}

.cap-panel--h5 {
  // Transcript control + 3 × 32px actions. Speaker row is tall enough that the first
  // caption line starts below them, so copy can use the full width.
  --cap-action-reserve: 180px;
  min-height: 44px;
  padding: 12px 16px;
  border-radius: 12px;
}

.cap-panel--hint {
  padding: 16px;
}

.cap-panel--h5.cap-panel--hint {
  padding: 12px 16px;
}

// Settings still needs a dock to sit on when the last speaker line has gone.
.cap-panel--empty {
  min-height: calc(var(--cap-primary-line) + 32px);
}

.cap-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--cap-primary-line);
  text-align: center;
}

.cap-placeholder__text {
  font-size: var(--cap-primary-size);
  line-height: var(--cap-primary-line);
}

.cap-list {
  min-width: 0;
}

.cap-row-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
    grid-template-rows var(--cap-row-duration, 0.28s) ease,
    opacity var(--cap-row-duration, 0.28s) ease,
    margin-bottom var(--cap-row-duration, 0.28s) ease;
}

.cap-row-enter-from,
.cap-row-leave-to {
  grid-template-rows: 0fr;
  margin-bottom: -12px;
  opacity: 0;
}

.cap-row-move {
  transition: transform var(--cap-row-duration, 0.28s) ease;
}

.cap-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  min-width: 0;
  min-height: 0;
}

.cap-avatar {
  flex: none;
  width: var(--cap-avatar-size);
  height: var(--cap-avatar-size);
}

.cap-body {
  flex: 1;
  min-width: 0;
}

.cap-speaker {
  overflow: hidden;
  margin-bottom: 2px;
  padding-right: var(--cap-action-reserve, 0px);
  font-size: var(--cap-speaker-size);
  line-height: var(--cap-speaker-line);
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.7;
}

.cap-panel--h5 .cap-speaker {
  // 12px panel padding + 28px row clears the 6+32px action strip.
  min-height: 28px;
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

.cap-trans__clip {
  min-height: 0;
  overflow: hidden;
}

.cap-line {
  display: flex;
  // Growing text scrolls upward, so the most recent words stay in view.
  align-items: flex-end;
  min-width: 0;
  overflow: hidden;
}

.cap-line__inner {
  width: 100%;
  overflow-wrap: break-word;
  word-break: normal;
  line-break: auto;
  white-space: pre-wrap;
}

.cap-line--primary {
  font-size: var(--cap-primary-size);
  line-height: var(--cap-primary-line);
}

.cap-line--secondary {
  margin-top: 4px;
  padding-left: 8px;
  font-size: var(--cap-secondary-size);
  line-height: var(--cap-secondary-line);
  border-left: 2px solid rgb(255 255 255 / 28%);
  opacity: 0;
  transition: opacity var(--cap-row-duration, 0.28s) ease;
}

.cap-trans.is-open .cap-line--secondary {
  opacity: 0.65;
}
</style>
