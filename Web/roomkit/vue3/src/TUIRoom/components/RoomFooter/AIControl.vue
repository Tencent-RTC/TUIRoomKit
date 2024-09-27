<template>
  <div v-if="AIControlConfig.visible" class="more-control-container">
    <icon-button
      :is-active="sidebarName === 'aiTranscription'"
      :title="t('AI Assistant')"
      :icon="AIIcon"
      @click-icon="toggleToolBox"
    />
    <div v-if="!isSidebarOpen && showToolBox" class="tool-box">
      <div class="tool-box-item" @click="openAISubtitles">
        <SvgIcon class="icon" :icon="AISubtitlesIcon" />
        <span v-if="!showSubtitles">{{
          t('Turn on AI real-time subtitles')
        }}</span>
        <span v-else>{{ t('Turn off AI real-time subtitles') }}</span>
      </div>
      <div class="tool-box-item" @click="toggleAITranscription">
        <SvgIcon class="icon" :icon="AITranscription" />
        <span>{{ t('Enable AI real-time meeting recording') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, defineEmits } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import AIIcon from '../common/icons/AIIcon.vue';
import AITranscription from '../common/icons/AITranscription.vue';
import AISubtitlesIcon from '../common/icons/AISubtitles.vue';
import { roomService } from '../../services';
import { useI18n } from '../../locales';
import SvgIcon from '../common/base/SvgIcon.vue';

const { t } = useI18n();
const emit = defineEmits(['show-overlay']);
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

const toggleAITranscription = () => {
  if (
    basicStore.setSidebarOpenStatus &&
    basicStore.sidebarName === 'aiTranscription'
  ) {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    return;
  }
  basicStore.setSidebarOpenStatus(true);
  basicStore.setSidebarName('aiTranscription');
  showToolBox.value = false;
};

const openAISubtitles = () => {
  showSubtitles.value = !showSubtitles.value;
  showToolBox.value = false;
  emit('show-overlay', {
    name: 'AISubtitlesOverlay',
    visible: showSubtitles.value,
  });
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
  background-color: var(--background-color-2);
  border-radius: 15px;
  box-shadow: 0 -8px 30px var(--footer-shadow-color);

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
    background: var(--tool-box-hover);
  }
}

.tui-theme-black .tool-box {
  --tool-box-hover: rgba(46, 50, 61, 0.7);
}

.tui-theme-white .tool-box {
  --tool-box-hover: rgba(79, 88, 107, 0.05);
}
</style>
