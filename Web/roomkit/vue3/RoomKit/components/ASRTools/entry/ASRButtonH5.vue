<template>
  <IconButtonH5
    :title="t('AITools.Entry')"
    @click="openMenu"
  >
    <IconAISubtitles :size="24" />
  </IconButtonH5>

  <TUIPopup v-model:visible="isMenuVisible" placement="bottom">
    <div class="asr-menu-sheet">
      <PopUpArrowDown @click="isMenuVisible = false" />
      <ASREntryMenu layout="h5" @close="isMenuVisible = false" />
    </div>
  </TUIPopup>

  <TUIPopup v-model:visible="recViewOpen" height="90%">
    <div class="transcription-popup-content">
      <PopUpArrowDown @click="recViewOpen = false" />
      <div class="transcription-popup-header">
        {{ t('AITools.RealtimeMessageList') }}
      </div>
      <RecordPanel layout="h5" />
    </div>
  </TUIPopup>

  <Teleport to="#roomPage > .room-container">
    <SubtitleDockH5
      v-if="isCaptionShown"
      :settings-open="isSettingsPopupVisible"
      @settings="toggleSettingsPanel"
    />
  </Teleport>
  <SubtitleSettingsSheetH5
    v-if="isSettingsPopupVisible"
    @close="isSettingsPopupVisible = false"
  />
  <ASRStartConfirmDialog layout="h5" />
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import {
  IconAISubtitles,
  TUIPopup,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomToolbarH5 } from '../../../hooks/useRoomToolbarH5';
import IconButtonH5 from '../../base/IconButtonH5.vue';
import PopUpArrowDown from '../../base/PopUpArrowDown.vue';
import ASREntryMenu from './ASREntryMenu.vue';
import ASRStartConfirmDialog from './ASRStartConfirmDialog.vue';
import RecordPanel from '../record/RecordPanel.vue';
import SubtitleDockH5 from '../caption/SubtitleDockH5.vue';
import SubtitleSettingsSheetH5 from '../settings/SubtitleSettingsSheetH5.vue';
import { useASRToolsState } from '../useASRToolsState';
import { useSubtitleViewState } from '../useSubtitleViewState';

const { t } = useUIKit();
const { showToolbar } = useRoomToolbarH5();
const { recViewOpen } = useSubtitleViewState();
const { asrOn, isCaptionShown } = useASRToolsState();
const isMenuVisible = ref(false);
const isSettingsPopupVisible = ref(false);

function openMenu() {
  isMenuVisible.value = true;
  showToolbar.value = false;
}

function openSettingsPanel() {
  recViewOpen.value = false;
  isMenuVisible.value = false;
  isSettingsPopupVisible.value = true;
  showToolbar.value = false;
}

function toggleSettingsPanel() {
  if (isSettingsPopupVisible.value) {
    isSettingsPopupVisible.value = false;
    return;
  }
  openSettingsPanel();
}

watch(recViewOpen, (open) => {
  if (open) {
    isMenuVisible.value = false;
    isSettingsPopupVisible.value = false;
    showToolbar.value = false;
  }
});

watch(isMenuVisible, (open) => {
  if (open) {
    recViewOpen.value = false;
    isSettingsPopupVisible.value = false;
  }
});

watch(asrOn, (on, previousOn) => {
  if (on || !previousOn) {
    return;
  }

  // Settings describe a running transcription; they must not outlive it.
  isSettingsPopupVisible.value = false;
});
</script>

<style lang="scss" scoped>
.asr-menu-sheet {
  padding: 0 12px 8px;
}

.transcription-popup-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  -webkit-tap-highlight-color: transparent;

  .transcription-popup-header {
    padding: 12px 20px;
    font-size: 16px;
    font-weight: 600;
  }
}
</style>
