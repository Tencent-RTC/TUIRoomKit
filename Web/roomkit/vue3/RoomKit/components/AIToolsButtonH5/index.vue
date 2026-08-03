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
      <RealtimeMessageList
        :target-language="targetLanguage"
        :display-mode="subtitleDisplayMode"
      />
    </div>
  </TUIPopup>

  <Teleport to="#roomPage">
    <div v-if="isSubtitlesVisible" class="ai-subtitle-h5">
      <Subtitle
        class="subtitle-panel-trigger-h5"
        :target-language="targetLanguage"
        :display-mode="subtitleDisplayMode"
        layout="h5"
        @click="openSettingsPanel"
      >
        <template #suffix>
          <div
            class="subtitle-settings-trigger-h5"
            @click="openSettingsPanel"
          >
            <IconRightArrow
              class="subtitle-arrow-h5"
              :size="10"
            />
          </div>
        </template>
      </Subtitle>
    </div>
  </Teleport>
  <AISettingsPopup
    v-if="isSettingsPopupVisible"
    :is-owner="isOwner"
    @close="isSettingsPopupVisible = false"
  />
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import {
  IconAIIcon,
  IconAISubtitles,
  IconAITranscription,
  IconRightArrow,
  TUIPopup,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import {
  RoomParticipantRole,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { Subtitle, RealtimeMessageList } from '../ASRTools';
import { useASRToolsState } from '../../hooks/useASRToolsState';
import { useRoomToolbarH5 } from '../../hooks/useRoomToolbarH5';
import { useSubtitlesState } from '../../hooks/useSubtitlesState';
import IconButtonH5 from '../base/IconButtonH5.vue';
import PopUpArrowDown from '../base/PopUpArrowDown.vue';
import AISettingsPopup from './AISettingsPopup.vue';

const { t } = useUIKit();
const { showToolbar } = useRoomToolbarH5();
const { isSubtitlesVisible } = useSubtitlesState();
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();
const {
  targetLanguage,
  subtitleDisplayMode,
  hasStartedASR,
  ensureASRStarted,
} = useASRToolsState();
const isAIToolsPanelVisible = ref(false);
const isTranscriptionPanelVisible = ref(false);
const isSettingsPopupVisible = ref(false);
const isOwner = computed(() => currentRoom.value?.roomOwner.userId === localParticipant.value?.userId);

function closeAIToolsPanel() {
  isAIToolsPanelVisible.value = false;
}

async function toggleSubtitles() {
  if (!isSubtitlesVisible.value) {
    await ensureASRStarted();
  }

  isSubtitlesVisible.value = !isSubtitlesVisible.value;
  showToolbar.value = false;
  closeAIToolsPanel();
}

async function openTranscriptionPanel() {
  if (!isTranscriptionPanelVisible.value) {
    await ensureASRStarted();
  }

  isTranscriptionPanelVisible.value = true;
  closeAIToolsPanel();
}

function openSettingsPanel() {
  isSettingsPopupVisible.value = true;
  showToolbar.value = false;
  closeAIToolsPanel();
}

function closeASRRelatedUI() {
  isSubtitlesVisible.value = false;
  isTranscriptionPanelVisible.value = false;
}

watch(
  hasStartedASR,
  (started, previousStarted) => {
    if (previousStarted && !started) {
      closeASRRelatedUI();
    }
  },
);

watch(() => localParticipant.value?.role, (role, previousRole) => {
  if (role === RoomParticipantRole.Owner && previousRole !== role) {
    closeASRRelatedUI();
  }
});

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

.subtitle-settings-trigger-h5 {
  width: 24px;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -4px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.subtitle-panel-trigger-h5 {
  width: 100%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.subtitle-arrow-h5 {
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-subtitle-h5 {
  position: fixed;
  left: 50%;
  bottom: 96px;
  transform: translateX(-50%);
  width: calc(100vw - 32px);
  max-width: 420px;
  display: flex;
  justify-content: center;
  pointer-events: none;
  text-align: initial;
}
</style>
