<template>
  <div class="transcript-list">
    <div v-if="isSearchEmpty" class="transcript-empty is-middle">
      {{ t('AITools.SearchNoResult', { keyword: keywordLabel }) }}
    </div>
    <div v-else-if="isIdleEmpty" class="transcript-empty is-middle">
      <IconTranscriptEmpty
        class="transcript-empty-icon"
        :size="26"
      />
      <div>{{ t('AITools.TranscriptEmpty') }}</div>
    </div>
    <div v-else class="transcript-scroll">
      <TUIList
        class="transcript-log"
        variant="plain"
        height="100%"
        item-size="auto"
        :item-height="72"
        :overscan="8"
        :scrollbar="true"
        :stick-to-bottom="!keyword"
        :at-bottom-threshold="32"
        jump-to-end
        :jump-label="t('RoomChat.jump_to_latest')"
      >
        <TUIListItem
          v-for="group in visibleGroups"
          :key="group.key"
          class="transcript-entry"
        >
          <TUIAvatar
            class="transcript-entry-avatar"
            :src="group.avatarUrl"
            :alt="group.speakerName"
            :size="24"
          />
          <div class="transcript-entry-main">
            <div class="transcript-entry-head">
              <span class="transcript-entry-name">
                <span
                  v-for="(segment, index) in group.nameSegments"
                  :key="index"
                  :class="{ 'transcript-hit': segment.isMatch }"
                >{{ segment.text }}</span>
              </span>
              <span class="transcript-entry-time">{{ group.time }}</span>
            </div>
            <div class="transcript-entry-bubble">
              <div class="transcript-entry-text">
                <template v-if="keyword">
                  <span
                    v-for="(segment, index) in group.sourceSegments"
                    :key="index"
                    :class="{ 'transcript-hit': segment.isMatch }"
                  >{{ segment.text }}</span>
                </template>
                <template v-else>
                  {{ group.sourceText }}
                </template>
                <span
                  v-if="group.isLive"
                  class="transcript-typing"
                  :aria-label="t('AITools.Recognizing')"
                >
                  <i /><i /><i />
                </span>
              </div>
              <div
                v-if="group.translationText"
                class="transcript-entry-trans"
              >
                <template v-if="keyword">
                  <span
                    v-for="(segment, index) in group.translationSegments"
                    :key="index"
                    :class="{ 'transcript-hit': segment.isMatch }"
                  >{{ segment.text }}</span>
                </template>
                <template v-else>
                  {{ group.translationText }}
                </template>
                <span
                  v-if="group.isLive"
                  class="transcript-typing"
                  aria-hidden="true"
                >
                  <i /><i /><i />
                </span>
              </div>
            </div>
          </div>
        </TUIListItem>
      </TUIList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAITranscriberState } from 'tuikit-atomicx-vue3/room';
import { IconTranscriptEmpty, TUIAvatar, TUIList, TUIListItem, t } from '../../../base';
import { formatTimestampToTime } from '../../../utils/formatTimestamp';
import {
  getDisplayAvatar,
  getDisplayName,
  getRecordLines,
  hasDisplayableText,
  splitHighlightSegments,
} from '../display';
import type { CaptionDisplayMode } from '../constants';
import type { HighlightSegment } from '../display';

interface RecordEntry {
  key: string;
  avatarUrl: string;
  speakerName: string;
  nameSegments: HighlightSegment[];
  time: string;
  sourceText: string;
  translationText: string;
  sourceSegments: HighlightSegment[];
  translationSegments: HighlightSegment[];
  isLive: boolean;
}

const props = withDefaults(defineProps<{
  targetLanguage?: string;
  captionMode?: CaptionDisplayMode;
  keyword?: string;
}>(), {
  targetLanguage: '',
  captionMode: 'bilingual',
  keyword: '',
});

const { realtimeMessageList } = useAITranscriberState();

const keywordLabel = computed(() => props.keyword.trim());

const visibleGroups = computed((): RecordEntry[] => {
  const keyword = keywordLabel.value;
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
      const sourceText = source;
      const translationText = translation;
      if (!sourceText) {
        return;
      }

      const searchableTexts = [speakerName, sourceText, translationText];
      if (keyword && !searchableTexts.join('\n').toLowerCase().includes(keyword.toLowerCase())) {
        return;
      }

      const timestamp = message.timestamp ?? 0;
      entries.push({
        key: message.segmentId || `${speakerUserId}-${timestamp}-${messageIndex}`,
        avatarUrl: getDisplayAvatar(speakerUserId),
        speakerName,
        nameSegments: splitHighlightSegments(speakerName, keyword),
        time: formatTimestampToTime(timestamp, 'HH:mm:ss'),
        sourceText,
        translationText,
        sourceSegments: splitHighlightSegments(sourceText, keyword),
        translationSegments: translationText
          ? splitHighlightSegments(translationText, keyword)
          : [],
        isLive,
      });
    });

  return entries;
});

const isSearchEmpty = computed(
  () => Boolean(keywordLabel.value) && visibleGroups.value.length === 0,
);

const isIdleEmpty = computed(
  () => !keywordLabel.value && visibleGroups.value.length === 0,
);

function copyText() {
  return visibleGroups.value.map((entry) => {
    const translation = entry.translationText ? `\n${entry.translationText}` : '';
    return `[${entry.time}] ${entry.speakerName}：${entry.sourceText}${translation}`;
  }).join('\n');
}

function entryCount() {
  return visibleGroups.value.length;
}

defineExpose({ copyText, entryCount });
</script>

<style scoped lang="scss">
.transcript-list {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  height: 0;
  min-height: 0;
}

.transcript-scroll {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.transcript-log {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 16px 12px;
}

.transcript-log :deep(.rk-list-row) {
  align-items: flex-start;
}

.transcript-log :deep(.rk-list-item) {
  align-items: flex-start;
  gap: 8px;
  height: auto;
  padding: 10px 0 0;
}

.transcript-empty {
  padding: 40px 12px;
  color: var(--rk-text-tertiary);
  font-size: var(--rk-fs-sm);
  line-height: 1.7;
  text-align: center;
}

.transcript-empty.is-middle {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 12px;
}

.transcript-empty-icon {
  display: block;
  width: 26px;
  height: 26px;
  margin: 0 auto 10px;
  opacity: 0.5;
}

.transcript-entry {
  display: flex;
  width: 100%;
}

.transcript-entry-avatar {
  flex: none;
  margin-top: 2px;
}

.transcript-entry-main {
  flex: 1;
  min-width: 0;
}

.transcript-entry-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 4px;
}

.transcript-entry-name {
  min-width: 0;
  overflow: hidden;
  color: var(--rk-text-primary);
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transcript-entry-time {
  flex: none;
  color: var(--rk-text-tertiary);
  font-size: var(--rk-fs-sm);
  line-height: 18px;
  font-variant-numeric: tabular-nums;
}

.transcript-entry-bubble {
  display: inline-block;
  box-sizing: border-box;
  max-width: 100%;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--rk-text-primary) 4%, var(--rk-bg-surface));
  border-radius: 12px;
  border-top-left-radius: 4px;
}

.transcript-entry-text {
  color: var(--rk-text-primary);
  font-size: var(--rk-fs-md);
  line-height: 1.55;
  word-break: break-word;
}

.transcript-entry-trans {
  margin-top: 5px;
  padding-top: 5px;
  color: var(--rk-text-secondary);
  font-size: var(--rk-fs-sm);
  line-height: 1.5;
  word-break: break-word;
  border-top: 1px solid var(--rk-border);
}

.transcript-typing {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  margin-left: 4px;
  vertical-align: middle;
}

.transcript-typing i {
  width: 3px;
  height: 3px;
  background: var(--rk-text-tertiary);
  border-radius: 50%;
  animation: transcript-typing-dot 1.4s ease-in-out infinite;
}

.transcript-typing i:nth-child(2) {
  animation-delay: 0.18s;
}

.transcript-typing i:nth-child(3) {
  animation-delay: 0.36s;
}

@keyframes transcript-typing-dot {
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

.transcript-hit {
  background: color-mix(in srgb, var(--rk-brand) 28%, transparent);
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .transcript-typing i {
    animation: none;
    opacity: 0.6;
  }
}
</style>
