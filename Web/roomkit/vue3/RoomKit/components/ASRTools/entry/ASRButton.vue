<template>
  <div
    v-click-outside="closeMenu"
    class="ai-tools-button-wrapper"
  >
    <IconButton
      :title="t('AITools.Entry')"
      @click-icon="toggleMenu"
    >
      <IconAISubtitles :size="24" />
    </IconButton>
    <transition name="menu-fade">
      <div
        v-show="showMenu"
        class="dropdown-menu"
        @click.stop
      >
        <ASREntryMenu layout="pc" @close="closeMenu" />
      </div>
    </transition>
  </div>
  <Teleport to="#roomPage > .room-container">
    <SubtitleDock v-if="isCaptionShown" />
  </Teleport>
  <ASRStartConfirmDialog layout="pc" />
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { IconAISubtitles, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../../base/IconButton.vue';
import vClickOutside from '../../base/vClickOutside';
import ASREntryMenu from './ASREntryMenu.vue';
import ASRStartConfirmDialog from './ASRStartConfirmDialog.vue';
import SubtitleDock from '../caption/SubtitleDock.vue';
import { useASRToolsState } from '../useASRToolsState';

const { t } = useUIKit();
const { isCaptionShown } = useASRToolsState();
const showMenu = ref(false);

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function closeMenu() {
  showMenu.value = false;
}
</script>

<style lang="scss" scoped>
.ai-tools-button-wrapper {
  position: relative;
  flex-shrink: 0;
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 1000;
  padding: 6px;
  background: var(--bg-color-operate);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--uikit-color-black-16);
  transform: translateX(-50%);
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.menu-fade-enter-to,
.menu-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
