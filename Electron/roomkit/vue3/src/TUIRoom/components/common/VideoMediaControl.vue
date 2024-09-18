<!--
  * Name: VideoMediaControl Video media operation component (on/off camera)
  * @param hasMore boolean Whether to display the [More] icon，which can switch camera
  * @param isMuted boolean Whether the video is muted or not
  * @param isDisabled boolean Whether the video is disabled or not
  * Usage:
  * Use <video-media-control :isMuted="isMuted" /> in the template
-->
<template>
  <div>
    <div
      v-click-outside="handleHideVideoSettingTab"
      class="video-control-container"
    >
      <icon-button
        :title="t('Camera')"
        :has-more="hasMore"
        :disabled="isDisabled"
        :is-not-support="!isSupportVideoMedia"
        @click-icon="handleClickIcon"
        @click-more="handleMore"
      >
        <svg-icon :icon="icon" />
      </icon-button>
      <video-setting-tab
        v-show="showVideoSettingTab"
        class="video-tab"
        :with-mirror="true"
        theme="white"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, Ref } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import TUIMessageBox from '../common/base/MessageBox/index';
import SvgIcon from '../common/base/SvgIcon.vue';
import CameraOnIcon from '../common/icons/CameraOnIcon.vue';
import CameraOffIcon from '../common/icons/CameraOffIcon.vue';
import VideoSettingTab from '../common/VideoSettingTab.vue';
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
}

const props = withDefaults(defineProps<Props>(), {
  hasMore: true,
  isMuted: undefined,
  isDisabled: false,
});

const emits = defineEmits(['click']);

const { t } = useI18n();
const showVideoSettingTab: Ref<boolean> = ref(false);
const isSupportVideoMedia =
  isGetUserMediaSupported && isEnumerateDevicesSupported;

const icon = computed(() => (props.isMuted ? CameraOffIcon : CameraOnIcon));

async function handleClickIcon() {
  if (!isSupportVideoMedia) {
    TUIMessageBox({
      title: t('Note'),
      message: t('The current browser does not support capturing video'),
      confirmButtonText: t('Sure'),
    });
    return;
  }
  emits('click');
  showVideoSettingTab.value = false;
}

function handleMore() {
  showVideoSettingTab.value = !showVideoSettingTab.value;
}

function handleHideVideoSettingTab() {
  if (showVideoSettingTab.value) {
    showVideoSettingTab.value = false;
  }
}
</script>

<style lang="scss" scoped>
$videoTabWidth: 305px;

.video-control-container {
  position: relative;

  .video-tab {
    position: absolute;
    bottom: calc(100% + 12px);
    left: -5px;
    width: $videoTabWidth;
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
      left: 30px;
      content: '';
      border-top: 5px solid var(--background-color-1);
      border-right: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 5px solid transparent;
    }
  }
}
</style>
