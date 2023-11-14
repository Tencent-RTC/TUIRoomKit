<!--
  * Name: AudioMediaControl Audio media operation component (on/off microphone)
  * @param hasMore boolean Whether to display the [More] icon，which can switch microphone and speaker
  * @param isMuted boolean Whether the audio is muted or not
  * @param isDisabled boolean Whether the audio is disabled or not
  * Usage:
  * Use <audio-media-control /> in the template
  *
  * 名称: AudioMediaControl 音频媒体操作组件（开关麦克风）
  * @param hasMore boolean 是否展示【更多】icon, 可以切换麦克风和扬声器
  * @param isMuted boolean 音频是否被静音状态
  * @param isDisabled boolean 音频是否 disabled 状态
  * 使用方式：
  * 在 template 中使用 <audio-media-control />
-->
<template>
  <div>
    <div v-click-outside="handleHideAudioSettingTab" class="audio-control-container">
      <icon-button
        :title="t('Mic')"
        :has-more="hasMore"
        :disabled="isDisabled"
        @click-icon="handleClickIcon"
        @click-more="handleMore"
      >
        <audio-icon
          :audio-volume="audioVolume"
          :is-muted="isMuted"
          :is-disabled="isDisabled"
        ></audio-icon>
      </icon-button>
      <audio-setting-tab
        v-show="showAudioSettingTab"
        theme="white"
        class="audio-tab"
        :audio-volume="audioVolume"
      ></audio-setting-tab>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import AudioSettingTab from '../common/AudioSettingTab.vue';
import AudioIcon from '../common/AudioIcon.vue';
import { useI18n } from '../../locales';
import '../../directives/vClickOutside';

interface Props {
  hasMore?: boolean,
  isMuted: boolean,
  isDisabled?: boolean,
  audioVolume: number,
}

withDefaults(defineProps<Props>(), {
  hasMore: true,
  isDisabled: false,
  audioVolume: 0,
});
const emits = defineEmits(['click']);

const showAudioSettingTab: Ref<boolean> = ref(false);
const { t } = useI18n();

async function handleClickIcon() {
  emits('click');
  showAudioSettingTab.value = false;
}

function handleMore() {
  showAudioSettingTab.value = !showAudioSettingTab.value;
}

function handleHideAudioSettingTab() {
  if (showAudioSettingTab.value) {
    showAudioSettingTab.value = false;
  }
}

</script>

<style lang="scss" scoped>

$audioTabWidth: 305px;

.audio-control-container {
  position: relative;
  .audio-tab {
    position: absolute;
    bottom: calc(100% + 12px);
    left: -5px;
    width: $audioTabWidth;
    background: var(--background-color-1);
    padding: 20px 20px 24px 20px;
    border-radius: 8px;
    box-shadow:
      0px 2px 4px -3px rgba(32, 77, 141, 0.03),
      0px 6px 10px 1px rgba(32, 77, 141, 0.06),
      0px 3px 14px 2px rgba(32, 77, 141, 0.05);
    &::before {
      content: '';
      position: absolute;
      left: 28px;
      bottom: -10px;
      border-top: 5px solid var(--background-color-1);
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 5px solid transparent;
    }
  }
}

</style>
