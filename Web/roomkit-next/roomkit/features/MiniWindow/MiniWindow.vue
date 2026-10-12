<template>
  <Teleport v-if="minimized" :disabled="!isPip" :to="container ?? 'body'">
    <div
      class="rk-root mini-window"
      :class="isPip ? 'mini-window-pip' : 'mini-window-floating'"
      :data-rk-theme="theme"
    >
      <div class="mini-window-picture">
        <!-- Info only: the tile chrome reads at this size, its more menu does not. -->
        <RoomView :layout-template="RoomLayoutTemplate.SingleLayout" hide-actions />
      </div>

      <div class="mini-window-controls">
        <MicButton hide-menu />
        <CameraButton hide-menu />
        <span class="mini-window-divider" />
        <ToolbarButton
          :label="t('Room.MiniRestore')"
          :icon="IconRestore"
          @click="restore"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { IconRestore, OVERLAY_CONTEXT_KEY, useUIConfig } from '../../base';
import { t } from '../../i18n';
import { RoomLayoutTemplate } from '../../core/types';
import ToolbarButton from '../../layouts/ToolbarButton.vue';
import CameraButton from '../Device/CameraButton/index.vue';
import MicButton from '../Device/MicButton/index.vue';
import RoomView from '../RoomView/RoomView/index.vue';
import { useMiniWindow } from './useMiniWindow';

const { uiConfig } = useUIConfig();
/* The picture-in-picture document needs the opener's theme carrier copied onto its
   mount point, and the provider already holds that element. */
const overlay = inject(OVERLAY_CONTEXT_KEY, null);
const { minimized, container, minimize, restore } = useMiniWindow(
  computed(() => overlay?.root.value ?? null),
);
const isPip = computed(() => Boolean(container.value));
const theme = computed(() => uiConfig.theme);

defineExpose({ minimize, restore });
</script>

<style scoped lang="scss">
.mini-window {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--rk-text-primary);
  background: var(--rk-bg-page);
}

.mini-window-pip {
  width: 100%;
  height: 100%;
}

.mini-window-floating {
  position: absolute;
  right: 20px;
  bottom: 20px;
  z-index: 40;
  width: 280px;
  max-width: calc(100% - 40px);
  height: 214px;
  min-height: 0;
  border: 1px solid var(--rk-border);
  border-radius: 14px;
  box-shadow: var(--rk-shadow-dialog);
}

.mini-window-picture {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--rk-bg-page);
}

.mini-window-picture > :deep(*) {
  width: 100%;
  height: 100%;
}

.mini-window-controls {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: var(--rk-bg-page);
}

.mini-window-divider {
  width: 1px;
  height: 20px;
  background: var(--rk-border);
}
</style>
