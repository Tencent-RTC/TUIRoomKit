<template>
  <div v-if="AIControlConfig.visible" class="more-control-container">
    <icon-button
      :is-active="sidebarName === 'aiTranscription'"
      :title="t('AI Assistant')"
      @click-icon="toggleToolBox"
    >
      <IconAIIcon size="24" />
    </icon-button>
    <div v-if="!isSidebarOpen && showToolBox" class="tool-box">
      <div class="tool-box-item" @click="openAISubtitles">
        <IconAISubtitles class="icon" />
        <span v-if="!showSubtitles">{{
          t('Turn on AI real-time subtitles')
        }}</span>
        <span v-else>{{ t('Turn off AI real-time subtitles') }}</span>
      </div>
      <div class="tool-box-item" @click="toggleAITranscription">
        <IconAITranscription class="icon" />
        <span>{{ t('Enable AI real-time meeting recording') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import {
  IconAIIcon,
  IconAISubtitles,
  IconAITranscription,
} from '@tencentcloud/uikit-base-component-vue3';
import { roomService } from '../../services';
import { useI18n } from '../../locales';
import {
  useRoomOverlayHooks,
  OverlayMap,
} from '../RoomOverlay/useRoomOverlayHooks.ts';

const { toggleOverlayVisibility } = useRoomOverlayHooks();
const { t } = useI18n();
const AIControlConfig = roomService.getComponentConfig('AIControl');
const { basicStore } = roomService;

const isSidebarOpen = computed(() => basicStore.isSidebarOpen);
const sidebarName = computed(() => basicStore.sidebarName);
const showToolBox = ref(false);
const showSubtitles = ref(false);

watch(isSidebarOpen, newValue => {
  showToolBox.value = newValue && false;
});

function toggleToolBox() {
  showToolBox.value = !showToolBox.value;
}

function handleExperienceAsr() {
  basicStore.setIsExperiencedAI(true);
  roomService.trackingManager.sendMessage('experience-room-ai');
}

const toggleAITranscription = () => {
  if (
    basicStore.setSidebarOpenStatus &&
    basicStore.sidebarName === 'aiTranscription'
  ) {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    return;
  }
  handleExperienceAsr();
  basicStore.setSidebarOpenStatus(true);
  basicStore.setSidebarName('aiTranscription');
  showToolBox.value = false;
};

const openAISubtitles = () => {
  showSubtitles.value = !showSubtitles.value;
  showToolBox.value = false;
  handleExperienceAsr();
  toggleOverlayVisibility(OverlayMap.AISubtitlesOverlay, showSubtitles.value);
};
</script>
<style lang="scss" scoped>
.tool-box {
  position: absolute;
  bottom: 72px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5px 0;
  border-radius: 15px;
  background-color: var(--bg-color-dialog);
  box-shadow: 0 -8px 30p var(--uikit-color-black-8);

  .tool-box-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    padding: 7px 10px;
    font-size: 12px;
    white-space: nowrap;
    cursor: pointer;

    .icon {
      margin-right: 8px;
    }
  }

  .tool-box-item:hover {
    border-radius: 8px;
    background-color: var(--list-color-hover);
  }
}
</style>
