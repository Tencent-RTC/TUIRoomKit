<!--
  * Name: AudioMediaControl Audio media operation component (on/off microphone)
  * @param hasMore boolean Whether to display the [More] icon，which can switch microphone and speaker
  * @param isMuted boolean Whether the audio is muted or not
  * @param isDisabled boolean Whether the audio is disabled or not
  * Usage:
  * Use <audio-media-control /> in the template
-->
<template>
  <div>
    <div
      v-click-outside="handleHideAudioSettingTab"
      class="audio-control-container"
    >
      <icon-button
        :title="t('Mic')"
        :has-more="hasMore"
        :disabled="isDisabled"
        :is-not-support="!isSupportAudioMedia"
        @click-icon="handleClickIcon"
        @click-more="handleMore"
      >
        <audio-icon
          :audio-volume="audioVolume"
          :is-muted="isMuted"
          :is-disabled="isDisabled"
        />
      </icon-button>
      <audio-setting-tab
        v-show="showAudioSettingTab"
        theme="white"
        class="audio-tab"
        :audio-volume="audioVolume"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import TUIMessageBox from '../common/base/MessageBox/index';
import AudioSettingTab from '../common/AudioSettingTab.vue';
import AudioIcon from '../common/AudioIcon.vue';
import { useI18n } from '../../locales';
import vClickOutside from '../../directives/vClickOutside';
import {
  isGetUserMediaSupported,
  isEnumerateDevicesSupported,
} from '../../utils/mediaAbility';

interface Props {
  hasMore?: boolean;
  isMuted: boolean;
  isDisabled?: boolean;
  audioVolume: number;
}

withDefaults(defineProps<Props>(), {
  hasMore: true,
  isDisabled: false,
  audioVolume: 0,
});
const emits = defineEmits(['click']);

const showAudioSettingTab: Ref<boolean> = ref(false);
const isSupportAudioMedia =
  isGetUserMediaSupported && isEnumerateDevicesSupported;
const { t } = useI18n();

async function handleClickIcon() {
  if (!isSupportAudioMedia) {
    TUIMessageBox({
      title: t('Note'),
      message: t('The current browser does not support capturing audio'),
      confirmButtonText: t('Sure'),
    });
    return;
  }
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
    padding: 20px 20px 24px;
    background: var(--background-color-1);
    border-radius: 8px;
    box-shadow:
      0 2px 4px -3px rgba(32, 77, 141, 0.03),
      0 6px 10px 1px rgba(32, 77, 141, 0.06),
      0 3px 14px 2px rgba(32, 77, 141, 0.05);

    &::before {
      position: absolute;
      bottom: -10px;
      left: 28px;
      content: '';
      border-top: 5px solid var(--background-color-1);
      border-right: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 5px solid transparent;
    }
  }
}
</style>
