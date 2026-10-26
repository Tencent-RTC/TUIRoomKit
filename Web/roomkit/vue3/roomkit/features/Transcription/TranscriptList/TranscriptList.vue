<template>
  <div class="transcript-panel">
    <TranscriptToolbar
      v-model:keyword="keyword"
      v-model:search-open="isSearchOpen"
      :asr-on="asrOn"
      :settings-pressed="isSettingsOpen"
      @toggle-search="toggleSearch"
      @close-search="closeSearch"
      @copy="copyLog"
      @settings="toggleSettings"
      @close-settings="closeSettings"
    >
      <template #settings>
        <SubtitleSettings
          v-if="isSettingsOpen"
          host="panel"
        />
      </template>
    </TranscriptToolbar>
    <TranscriptLog
      ref="listRef"
      :target-language="targetLanguage"
      :caption-mode="captionDisplayMode"
      :keyword="keyword"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useASRState } from '../useASRState';
import SubtitleSettings from './SubtitleSettings.vue';
import TranscriptLog from './TranscriptLog.vue';
import TranscriptToolbar from './TranscriptToolbar.vue';
import { useTranscriptToolbar } from './useTranscriptToolbar';

const {
  targetLanguage,
  asrOn,
  captionDisplayMode,
} = useASRState();

const isSettingsOpen = ref(false);
const {
  keyword,
  isSearchOpen,
  listRef,
  toggleSearch: toggleSearchField,
  closeSearch,
  copyLog,
} = useTranscriptToolbar();

function closeSettings() {
  isSettingsOpen.value = false;
}

function toggleSearch() {
  toggleSearchField();
  closeSettings();
}

function toggleSettings() {
  isSettingsOpen.value = !isSettingsOpen.value;
  if (isSettingsOpen.value) {
    closeSearch();
  }
}

</script>

<style scoped lang="scss">
.transcript-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
