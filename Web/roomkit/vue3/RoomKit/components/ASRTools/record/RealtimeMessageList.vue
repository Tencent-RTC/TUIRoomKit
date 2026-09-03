<template>
  <div :class="['rec-list-shell', `rec-list-shell--${layout}`]">
    <div
      ref="listRef"
      :class="['rec-list', `rec-list--${layout}`]"
      @scroll="handleScroll"
    >
      <div v-if="isSearchEmpty" class="rec-list__no-result">
        {{ t('AITools.SearchNoResult') }}
      </div>
      <template v-else>
        <div class="rec-list__notice">
          {{ noticeText }}
        </div>
        <div v-if="isIdleEmpty" class="rec-list__idle">
          <IconAITranscription class="rec-list__idle-icon" :size="36" />
          <div class="rec-list__idle-title">
            {{ t('AITools.RecordListeningTitle') }}
          </div>
          <div class="rec-list__idle-sub">
            {{ t('AITools.RecordListeningSub') }}
          </div>
        </div>
        <div
          v-for="group in visibleGroups"
          :key="group.key"
          class="rec-entry"
        >
          <div class="rec-entry__head">
            <Avatar
              class="rec-entry__avatar"
              :src="group.avatarUrl"
              :size="26"
            />
            <span class="rec-entry__name">
              <span
                v-for="(segment, index) in group.nameSegments"
                :key="index"
                :class="{ 'rec-hit': segment.isMatch }"
              >{{ segment.text }}</span>
            </span>
            <span class="rec-entry__time">{{ group.time }}</span>
          </div>
          <div class="rec-entry__bubble">
            <div class="rec-entry__line">
              <span
                v-for="(segment, index) in group.sourceSegments"
                :key="index"
                :class="{ 'rec-hit': segment.isMatch }"
              >{{ segment.text }}</span>
            </div>
            <template v-if="group.translationSegments.length">
              <div class="rec-entry__rule" />
              <div class="rec-entry__line rec-entry__line--secondary">
                <span
                  v-for="(segment, index) in group.translationSegments"
                  :key="index"
                  :class="{ 'rec-hit': segment.isMatch }"
                >{{ segment.text }}</span>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
    <Transition name="rec-jump">
      <button
        v-if="showJumpToLatest"
        type="button"
        class="rec-jump"
        @click="jumpToLatest"
      >
        <svg
          class="rec-jump__icon"
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path d="M2.2 1.6 6 5.4l3.8-3.8" />
          <path d="M2.2 6.6 6 10.4l3.8-3.8" />
        </svg>
        <span>{{ t('AITools.BackToLatest') }}</span>
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useUIKit, IconAITranscription } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar, useAITranscriberState } from 'tuikit-atomicx-vue3/room';
import { useASRToolsState } from '../useASRToolsState';
import {
  getDisplayAvatar,
  getDisplayName,
  getRecordLines,
  hasDisplayableText,
  splitHighlightSegments,
  withLiveEllipsis,
} from '../utils/display';
import { formatTimestampToTime } from '../utils/formatTimestampToTime';
import type { CaptionDisplayMode } from '../constants';
import type { HighlightSegment } from '../utils/display';

interface RecordEntry {
  key: string;
  avatarUrl: string;
  speakerName: string;
  nameSegments: HighlightSegment[];
  time: string;
  sourceSegments: HighlightSegment[];
  translationSegments: HighlightSegment[];
}

const props = withDefaults(defineProps<{
  targetLanguage?: string;
  captionMode?: CaptionDisplayMode;
  keyword?: string;
  layout?: 'pc' | 'h5';
}>(), {
  targetLanguage: '',
  captionMode: 'bilingual',
  keyword: '',
  layout: 'pc',
});

const { t } = useUIKit();
const { realtimeMessageList } = useAITranscriberState();
const { asrOn } = useASRToolsState();

const listRef = ref<HTMLElement>();
const isUserScrolling = ref(false);

const visibleGroups = computed((): RecordEntry[] => {
  const keyword = props.keyword.trim();
  const entries: RecordEntry[] = [];

  realtimeMessageList.value
    .filter(message => (
      hasDisplayableText(message.sourceText)
      && typeof message.timestamp === 'number'
      && Number.isFinite(message.timestamp)
    ))
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
    .forEach((message, messageIndex) => {
      const speakerUserId = message.speakerUserId || 'unknown';
      const speakerName = getDisplayName(speakerUserId);
      const isLive = message.isCompleted === false;
      const { source, translation } = getRecordLines(
        message,
        props.targetLanguage,
        props.captionMode,
      );
      const sourceText = withLiveEllipsis(source, isLive);
      const translationText = withLiveEllipsis(translation, isLive);
      if (!sourceText) {
        return;
      }

      const searchableTexts = [speakerName, sourceText, translationText];
      if (keyword && !searchableTexts.join('\n').toLowerCase().includes(keyword.toLowerCase())) {
        return;
      }

      entries.push({
        key: message.segmentId || `${speakerUserId}-${message.timestamp}-${messageIndex}`,
        avatarUrl: getDisplayAvatar(speakerUserId),
        speakerName,
        nameSegments: splitHighlightSegments(speakerName, keyword),
        time: formatTimestampToTime(message.timestamp ?? 0, 'HH:mm:ss'),
        sourceSegments: splitHighlightSegments(sourceText, keyword),
        translationSegments: translationText
          ? splitHighlightSegments(translationText, keyword)
          : [],
      });
    });

  return entries;
});

const isSearchEmpty = computed(
  () => Boolean(props.keyword.trim()) && visibleGroups.value.length === 0,
);

const isIdleEmpty = computed(
  () => !props.keyword.trim() && visibleGroups.value.length === 0,
);

const noticeText = computed(() => (
  asrOn.value
    ? t('AITools.RecordDisclaimerOn')
    : t('AITools.RecordDisclaimerOff')
));

// Shown only after the user leaves the live tail. Search already starts at the
// first hit, so the jump chip stays hidden until the keyword is cleared.
const showJumpToLatest = computed(() => (
  isUserScrolling.value
  && visibleGroups.value.length > 0
  && !props.keyword.trim()
));

function isAtBottom() {
  const list = listRef.value;
  if (!list) {
    return false;
  }

  return Math.ceil(list.scrollTop + list.clientHeight) >= list.scrollHeight - 50;
}

function scrollToBottom(force = false) {
  if (!listRef.value || (!force && isUserScrolling.value)) {
    return;
  }
  requestAnimationFrame(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight;
    }
  });
}

function jumpToLatest() {
  isUserScrolling.value = false;
  scrollToBottom(true);
}

function handleScroll() {
  if (listRef.value) {
    isUserScrolling.value = !isAtBottom();
  }
}

onMounted(scrollToBottom);

watch(
  () => realtimeMessageList.value.map(message => (
    `${message.segmentId}:${message.sourceText}:${message.isCompleted}`
  )).join('|'),
  () => {
    nextTick(() => {
      if (!isUserScrolling.value) {
        scrollToBottom();
      }
    });
  },
);

// Searching starts from the first hit; clearing the search returns to the live
// tail, which is where an unfiltered list is expected to sit.
watch(() => props.keyword, (keyword) => {
  nextTick(() => {
    if (!listRef.value) {
      return;
    }
    if (keyword.trim()) {
      listRef.value.scrollTop = 0;
      isUserScrolling.value = true;
      return;
    }
    isUserScrolling.value = false;
    scrollToBottom();
  });
});
</script>

<style scoped lang="scss">
.rec-list-shell {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.rec-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  padding: 0px 16px 20px;
  overflow-y: auto;
  text-align: initial;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--stroke-color-secondary);
    border-radius: 3px;
  }
}

.rec-list--h5 {
  gap: 22px;
  padding: 12px 20px calc(16px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
}

.rec-list__no-result {
  padding: 28px 0;
  color: var(--text-color-tertiary);
  font-size: 13px;
  text-align: center;
}

.rec-list__notice {
  flex: none;
  padding: 8px 12px;
  color: var(--text-color-secondary);
  font-size: 12px;
  line-height: 18px;
  background: color-mix(in srgb, var(--text-color-primary) 6%, transparent);
  border-radius: 8px;
}

.rec-list__idle {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 220px;
  padding: 48px 24px;
  text-align: center;
}

.rec-list__idle-icon {
  color: var(--text-color-tertiary);
}

.rec-list__idle-title {
  color: var(--text-color-secondary);
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.rec-list__idle-sub {
  color: var(--text-color-tertiary);
  font-size: 12px;
  line-height: 18px;
}

.rec-entry {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 8px;
}

.rec-entry__head {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.rec-entry__avatar {
  flex: none;
  width: 36px;
  height: 36px;
}

.rec-entry__name {
  min-width: 0;
  overflow: hidden;
  color: var(--text-color-secondary);
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rec-entry__time {
  flex: none;
  color: var(--text-color-tertiary);
  font-size: 12px;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
}

.rec-entry__bubble {
  box-sizing: border-box;
  width: fit-content;
  max-width: 100%;
  padding: 8px 14px;
  background: var(--bg-color-bubble-reciprocal);
  border-radius: 0 12px 12px 12px;
}

.rec-entry__line {
  color: var(--text-color-primary);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.rec-entry__line--secondary {
  color: var(--text-color-secondary);
}

.rec-entry__rule {
  height: 1px;
  margin: 6px 0;
  background: color-mix(in srgb, var(--text-color-primary) 8%, transparent);
}

.rec-hit {
  padding: 0 1px;
  color: inherit;
  background: color-mix(in srgb, var(--text-color-link) 26%, transparent);
  border-radius: 3px;
}

.rec-jump {
  position: absolute;
  right: 16px;
  bottom: 32px;
  z-index: 1;
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 6px 12px;
  color: var(--text-color-link);
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  background: var(--bg-color-operate);
  border: 1px solid color-mix(in srgb, var(--text-color-link) 32%, transparent);
  border-radius: 999px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 18%);
  cursor: pointer;
  appearance: none;
  user-select: none;
  font-family: inherit;

  .rec-list-shell--h5 & {
    right: 20px;
    bottom: calc(32px + env(safe-area-inset-bottom, 0px));
  }
}

.rec-jump__icon {
  flex: none;
  width: 12px;
  height: 12px;

  path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.rec-jump-enter-active,
.rec-jump-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.rec-jump-enter-from,
.rec-jump-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
