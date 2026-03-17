<template>
  <div
    v-if="overflowWidgets.length > 0"
    v-click-outside="handleClickOutside"
    class="more-button-wrapper"
  >
    <icon-button
      :is-active="showMenu"
      :title="t('RoomMore.Title')"
      @click-icon="toggleMenu"
    >
      <IconMore :size="24" />
    </icon-button>
    <transition name="menu-fade">
      <div
        v-show="showMenu"
        class="dropdown-menu"
        @click.stop
      >
        <slot />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  useUIKit,
  IconMore,
} from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../base/IconButton.vue';
import vClickOutside from '../base/vClickOutside';
import type { WidgetConfig } from '../../adapter/type';

interface Props {
  overflowWidgets: WidgetConfig[];
}

defineProps<Props>();

const { t } = useUIKit();
const showMenu = ref(false);

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function handleClickOutside() {
  showMenu.value = false;
}
</script>

<style lang="scss" scoped>
.more-button-wrapper {
  position: relative;
  flex-shrink: 0;
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-color-operate);
  border: 1px solid var(--stroke-color-primary);
  border-radius: 8px;
  padding: 8px 12px;
  box-sizing: border-box;
  gap: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  box-shadow: 0 4px 12px var(--uikit-color-black-16);
  z-index: 1000;
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
