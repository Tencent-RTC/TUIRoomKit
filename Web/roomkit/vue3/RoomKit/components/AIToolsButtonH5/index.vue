<template>
  <IconButtonH5 :title="t('AITools.Title')" @click="isAIToolsPanelVisible = true">
    <IconAIIcon :size="24" />
  </IconButtonH5>

  <TUIPopup
    v-model:visible="isAIToolsPanelVisible"
    placement="bottom"
    @close="closeAIToolsPanel"
  >
    <div class="ai-tools-popup-container">
      <PopUpArrowDown @click="closeAIToolsPanel" />
      <div class="ai-tools-popup-content">
        <div class="section-title">
          {{ t('AITools.Title') }}
        </div>
        <div class="ai-tools-section">
          <div class="ai-tools-item" @click="toggleSubtitles">
            <div class="ai-tools-item-left">
              <IconAISubtitles :size="18" />
              <span class="ai-tools-item-text">{{ isSubtitlesVisible ? t('AITools.SubtitlesClose') : t('AITools.SubtitlesOpen') }}</span>
            </div>
          </div>
          <div class="ai-tools-item" @click="openTranscriptionPanel">
            <div class="ai-tools-item-left">
              <IconAITranscription :size="18" />
              <span class="ai-tools-item-text">{{ t('AITools.RealtimeMessageListOpen') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TUIPopup>

  <TUIPopup v-model:visible="isTranscriptionPanelVisible" height="90%">
    <div class="transcription-popup-content">
      <PopUpArrowDown @click="isTranscriptionPanelVisible = false" />
      <div class="transcription-popup-header">
        {{ t('AITools.RealtimeMessageList') }}
      </div>
      <RealtimeMessageList />
    </div>
  </TUIPopup>

  <Teleport to="body">
    <Subtitle v-if="isSubtitlesVisible" />
  </Teleport>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import {
  IconAIIcon,
  IconAISubtitles,
  IconAITranscription,
  TUIPopup,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { Subtitle, RealtimeMessageList } from 'tuikit-atomicx-vue3/room';
import { useRoomToolbarH5 } from '../../hooks/useRoomToolbarH5';
import IconButtonH5 from '../base/IconButtonH5.vue';
import PopUpArrowDown from '../base/PopUpArrowDown.vue';

const { t } = useUIKit();
const { showToolbar } = useRoomToolbarH5();

const isSubtitlesVisible = ref(false);
const isAIToolsPanelVisible = ref(false);
const isTranscriptionPanelVisible = ref(false);

function closeAIToolsPanel() {
  isAIToolsPanelVisible.value = false;
}

function toggleSubtitles() {
  isSubtitlesVisible.value = !isSubtitlesVisible.value;
  showToolbar.value = false;
  closeAIToolsPanel();
}

function openTranscriptionPanel() {
  isTranscriptionPanelVisible.value = true;
  closeAIToolsPanel();
}
</script>

<style lang="scss" scoped>
.ai-tools-popup-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  -webkit-tap-highlight-color: transparent;
  -moz-tap-highlight-color: transparent;
}

.ai-tools-popup-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
  -webkit-overflow-scrolling: touch;
}

.section-title {
  margin-bottom: 8px;
  color: var(--text-color-secondary, rgba(255, 255, 255, 0.55));
  font-size: 14px;
  font-weight: 400;
  line-height: normal;
  letter-spacing: -0.24px;
}

.ai-tools-section {
  border-radius: 12px;
  background-color: var(--bg-color-entrycard);
  padding: 0 12px;
  color: var(--text-color-primary, rgba(255, 255, 255, 0.9));
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: -0.24px;
}

.ai-tools-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;

  &:not(:last-child) {
    border-bottom: 1px solid var(--stroke-color-primary);
  }

  .ai-tools-item-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ai-tools-item-text {
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: var(--text-color-primary, #e3e5e8);
  }
}

.transcription-popup-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  -webkit-tap-highlight-color: transparent;

  .transcription-popup-header {
    font-size: 16px;
    font-weight: 600;
    padding: 12px 20px;
  }
}
</style>
