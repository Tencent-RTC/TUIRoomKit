<template>
  <div class="transcript-mobile">
    <TranscriptToolbar
      v-model:keyword="keyword"
      v-model:search-open="isSearchOpen"
      mobile
      :asr-on="asrOn"
      @toggle-search="toggleSearch"
      @close-search="closeSearch"
      @copy="copyLog"
      @settings="emit('open-settings')"
    />
    <TranscriptLog
      ref="listRef"
      :target-language="targetLanguage"
      :caption-mode="captionDisplayMode"
      :keyword="keyword"
    />
  </div>
</template>

<script setup lang="ts">
import { useASRState } from '../useASRState';
import TranscriptLog from './TranscriptLog.vue';
import TranscriptToolbar from './TranscriptToolbar.vue';
import { useTranscriptToolbar } from './useTranscriptToolbar';

const emit = defineEmits<{
  'open-settings': [];
}>();

const { targetLanguage, asrOn, captionDisplayMode } = useASRState();

const {
  keyword,
  isSearchOpen,
  listRef,
  toggleSearch,
  closeSearch,
  copyLog,
} = useTranscriptToolbar();
</script>

<style scoped lang="scss">
.transcript-mobile {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.transcript-mobile :deep(.transcript-list .transcript-log) {
  padding: 8px 16px 4px;
}

.transcript-mobile :deep(.transcript-empty) {
  font-size: var(--rk-fs-sm);
}

.transcript-mobile :deep(.rk-list-jump) {
  color: #fff;
  background: rgb(44 44 46);
  border: 0;
  box-shadow: none;
}

.transcript-mobile :deep(.transcript-entry-name),
.transcript-mobile :deep(.transcript-entry-time) {
  font-size: var(--rk-fs-sm);
  line-height: 16px;
}

.transcript-mobile :deep(.transcript-entry-text) {
  font-size: var(--rk-fs-md);
}

.transcript-mobile :deep(.transcript-entry-trans) {
  font-size: var(--rk-fs-sm);
}
</style>
