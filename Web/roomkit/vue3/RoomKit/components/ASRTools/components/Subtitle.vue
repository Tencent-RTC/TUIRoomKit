<template>
  <div
    :class="['subtitle-panel', `subtitle-panel--${props.layout}`]"
    :style="subtitleCssVars"
  >
    <div v-if="$slots.actions" class="subtitle-actions">
      <slot name="actions" />
    </div>
    <div class="subtitle-body">
      <div v-if="shouldShowPlaceholder" class="subtitle-placeholder">
        <span class="subtitle-placeholder__text">{{ t('ASRTools.SubtitlePlaceholder') }}</span>
      </div>
      <div v-else class="subtitle-scroll">
        <div
          v-for="item in displayMessages"
          :key="item.speakerUserId"
          class="subtitle-item"
        >
          <span
            v-if="item.showSpeaker"
            class="subtitle-speaker"
            :title="getDisplayName(item.speakerUserId)"
          >{{ getDisplayName(item.speakerUserId) }}</span>
          <div class="subtitle-content">
            <span
              class="subtitle-text subtitle-text--primary"
              :style="{ maxHeight: `${item.maxLinesPerText * textLineHeight}px` }"
            >
              <span class="subtitle-text__inner">
                {{ item.primaryLine }}
              </span>
            </span>
            <span
              v-if="item.secondaryLine"
              class="subtitle-text subtitle-text--secondary"
              :style="{ maxHeight: `${item.maxLinesPerText * textLineHeight}px` }"
            >
              <span class="subtitle-text__inner">
                {{ item.secondaryLine }}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div v-if="$slots.suffix" class="subtitle-suffix">
        <slot name="suffix" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useAITranscriberState } from 'tuikit-atomicx-vue3/room';
import { RealtimeTranscriberEvent } from 'tuikit-atomicx-vue3';
import { SUBTITLE_CLEAR_DELAY_MS } from '../constants';
import { getDisplayName, getMessageDisplayLines } from '../utils/display';
import type { RealtimeTranscriberEventInfoMap, TranscriberMessage } from 'tuikit-atomicx-vue3';
import type { SubtitleDisplayMode } from 'tuikit-atomicx-vue3';

const SUBTITLE_LAYOUT_TYPOGRAPHY = {
  pc: {
    textLineHeight: 16,
    placeholderFontSize: 14,
    placeholderLineHeight: 22,
    speakerFontSize: 12,
    speakerLineHeight: 16,
    contentFontSize: 12,
  },
  h5: {
    textLineHeight: 24,
    placeholderFontSize: 16,
    placeholderLineHeight: 24,
    speakerFontSize: 14,
    speakerLineHeight: 20,
    contentFontSize: 16,
  },
} as const;

const props = withDefaults(defineProps<{
  targetLanguage?: string;
  displayMode?: SubtitleDisplayMode;
  layout?: 'pc' | 'h5';
}>(), {
  targetLanguage: '',
  displayMode: 'translation',
  layout: 'pc',
});

const { subscribeEvent, unsubscribeEvent } = useAITranscriberState();
const { t } = useUIKit();

const subtitleMessages = ref<{ [key: string]: TranscriberMessage }>({});
const subtitleTimeout: { [key: string]: ReturnType<typeof setTimeout> } = {};

const effectiveTargetLanguage = computed(() => props.targetLanguage);
const effectiveDisplayMode = computed(() => props.displayMode);
const typography = computed(() => SUBTITLE_LAYOUT_TYPOGRAPHY[props.layout]);
const textLineHeight = computed(() => typography.value.textLineHeight);
const subtitleCssVars = computed(() => ({
  '--subtitle-placeholder-font-size': `${typography.value.placeholderFontSize}px`,
  '--subtitle-placeholder-line-height': `${typography.value.placeholderLineHeight}px`,
  '--subtitle-speaker-font-size': `${typography.value.speakerFontSize}px`,
  '--subtitle-speaker-line-height': `${typography.value.speakerLineHeight}px`,
  '--subtitle-text-font-size': `${typography.value.contentFontSize}px`,
  '--subtitle-text-line-height': `${typography.value.textLineHeight}px`,
}));

const resetSubtitleTimeout = (speakerUserId: string, message: TranscriberMessage) => {
  if (subtitleTimeout[speakerUserId]) {
    clearTimeout(subtitleTimeout[speakerUserId]);
  }
  subtitleTimeout[speakerUserId] = setTimeout(() => {
    const currentMessage = subtitleMessages.value[speakerUserId];
    if (
      currentMessage?.segmentId === message.segmentId
      && currentMessage?.timestamp === message.timestamp
    ) {
      delete subtitleMessages.value[speakerUserId];
    }
    delete subtitleTimeout[speakerUserId];
  }, SUBTITLE_CLEAR_DELAY_MS);
};

const handleTranscriberMessage = (message: TranscriberMessage) => {
  const { speakerUserId } = message;
  subtitleMessages.value[speakerUserId] = message;
  resetSubtitleTimeout(speakerUserId, message);
};

const onReceiveTranscriberMessageHandler = (eventInfo: RealtimeTranscriberEventInfoMap[RealtimeTranscriberEvent.onReceiveTranscriberMessage]) => {
  handleTranscriberMessage(eventInfo.message);
};

onMounted(() => {
  subscribeEvent(RealtimeTranscriberEvent.onReceiveTranscriberMessage, onReceiveTranscriberMessageHandler as any);
});

const displayMessages = computed(() => {
  const messages = Object.values(subtitleMessages.value)
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
    .map(message => ({
      ...message,
      lines: getMessageDisplayLines(
        message,
        effectiveTargetLanguage.value,
        effectiveDisplayMode.value,
      ),
    }))
    .filter(message => message.lines.length)
    .slice(-2);

  const maxLinesPerText = messages.length <= 1 ? 2 : 1;

  return messages.map(message => ({
    ...message,
    primaryLine: message.lines[0] || '',
    secondaryLine: effectiveDisplayMode.value === 'bilingual' ? (message.lines[1] || '') : '',
    showSpeaker: true,
    maxLinesPerText,
  }));
});

const shouldShowPlaceholder = computed(() => displayMessages.value.length === 0);

onUnmounted(() => {
  unsubscribeEvent(RealtimeTranscriberEvent.onReceiveTranscriberMessage, onReceiveTranscriberMessageHandler as any);
  Object.values(subtitleTimeout).forEach((timeout) => {
    clearTimeout(timeout);
  });
});

</script>

<style scoped lang="scss">
.subtitle-panel {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 132px;
  max-height: 176px;
  padding: 18px 22px;
  border-radius: 16px;
  background-color: var(--bg-color-mask);
  box-sizing: border-box;
  pointer-events: auto;
}

.subtitle-panel--h5 {
  min-height: auto;
  max-height: 220px;
  padding: 18px 20px;
  border-radius: 8px;
  background: rgba(28, 28, 32, 0.9);
}

.subtitle-placeholder {
  width: 100%;
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.subtitle-placeholder__text {
  font-family: 'PingFang SC', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--text-color-button);
}

.subtitle-panel--h5 .subtitle-placeholder {
  min-height: 24px;
}

.subtitle-panel--h5 .subtitle-placeholder__text {
  font-size: var(--subtitle-placeholder-font-size);
  line-height: var(--subtitle-placeholder-line-height);
}

.subtitle-body {
  width: 100%;
  display: flex;
  align-items: stretch;
  gap: 4px;
}

.subtitle-panel--h5 .subtitle-body {
  align-items: center;
  gap: 12px;
}

.subtitle-scroll {
  flex: 1;
  min-width: 0;
  max-height: 136px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: transparent;
    transition: background 0.2s ease;
  }

  &:hover {
    scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
  }

  &:hover::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.22);
  }
}

.subtitle-panel--h5 .subtitle-scroll {
  max-height: 184px;
  padding-right: 0;
  gap: 10px;
}

.subtitle-actions {
  margin-left: auto;
}

.subtitle-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  color: var(--text-color-button);
  font-size: 14px;
  line-height: 22px;
  width: 100%;
  min-width: 0;
}

.subtitle-speaker {
  opacity: 0.8;
  max-width: calc(100% - 8px);
  font-family: 'PingFang SC', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtitle-panel--h5 .subtitle-speaker {
  opacity: 0.92;
  max-width: 100%;
  margin-bottom: 2px;
  font-size: var(--subtitle-speaker-font-size);
  font-weight: 500;
  line-height: var(--subtitle-speaker-line-height);
  color: rgba(255, 255, 255, 0.75);
}

.subtitle-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  min-width: 0;
}

.subtitle-panel--h5 .subtitle-content {
  gap: 4px;
}

.subtitle-text {
  font-family: 'PingFang SC', sans-serif;
  font-size: 12px;
  font-weight: 400;
  display: flex;
  align-items: flex-end;
  width: 100%;
  line-height: 16px;
  min-height: 16px;
  overflow: hidden;
}

.subtitle-panel--h5 .subtitle-text {
  font-size: var(--subtitle-text-font-size);
  font-weight: 400;
  line-height: var(--subtitle-text-line-height);
  min-height: var(--subtitle-text-line-height);
  letter-spacing: 0;
  color: rgba(255, 255, 255, 0.96);
}

.subtitle-text__inner {
  width: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  position: relative;
}

.subtitle-suffix {
  flex: 0 0 auto;
  align-self: center;
  min-height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.subtitle-panel--h5 .subtitle-suffix {
  align-self: stretch;
  min-height: 100%;
}

.subtitle-text--primary {
  opacity: 1;
}

.subtitle-text--secondary {
  opacity: 1;
}
</style>
