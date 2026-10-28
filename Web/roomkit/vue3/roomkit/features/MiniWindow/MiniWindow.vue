<template>
  <Teleport v-if="minimized" :disabled="!isPip" :to="container ?? 'body'">
    <div
      class="rk-root mini-window"
      :class="isPip ? 'mini-window-pip' : 'mini-window-floating'"
      :data-rk-theme="theme"
    >
      <div class="mini-window-picture">
        <!-- Info only: the tile chrome reads at this size, its more menu does not. -->
        <RoomViewPC :layout-template="RoomLayoutTemplate.SingleLayout" :stage-stream="stageStream" hide-actions />
      </div>

      <div class="mini-window-controls">
        <MicButton hide-menu />
        <CameraButton hide-menu />
        <span class="mini-window-divider" />
        <ToolbarButtonPC
          :label="t('Room.MiniRestore')"
          :icon="IconRestore"
          @click="restore"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject, watch } from 'vue';
import { DeviceStatus, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { IconRestore, OVERLAY_CONTEXT_KEY, TUIToast, useUIConfig, t } from '../../base';
import { RoomLayoutTemplate } from '../../core/types';
import ToolbarButtonPC from '../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';
import CameraButton from '../Device/CameraButton/index.vue';
import MicButton from '../Device/MicButton/index.vue';
import RoomViewPC from '../RoomView/RoomViewPC/RoomViewPC.vue';
import { useSingleStageStream } from '../RoomView/useParticipantStreams';
import { useWhiteboardState } from '../Whiteboard/WhiteboardState';
import { useMiniWindow } from './useMiniWindow';

const { uiConfig } = useUIConfig();
const { isSessionActive } = useWhiteboardState();
const { stageStream } = useSingleStageStream();
/* The picture-in-picture document needs the opener's theme carrier copied onto its
   mount point, and the provider already holds that element. */
const overlay = inject(OVERLAY_CONTEXT_KEY, null);
const { screenStatus } = useDeviceState();
const { minimized, container, minimize: openWindow, restore, dismissAuto, close } = useMiniWindow(
  computed(() => overlay?.root.value ?? null),
);
const isPip = computed(() => Boolean(container.value));
const theme = computed(() => uiConfig.theme);

/* The mini window cannot carry a board or an annotation, so either one keeps it shut from
   the moment it starts: before the SDK binds an annotation, and while a board is still
   faking the local share it has no picture for. A local screen share keeps it shut too. */
const isScreenSharing = computed(() => screenStatus.value === DeviceStatus.On);
const blockedTip = computed(() => {
  if (isSessionActive.value) return 'Room.PipUnavailableWithWhiteboard';
  if (isScreenSharing.value) return 'Room.PipUnavailableWithScreenShare';
  return '';
});
const blocked = computed(() => Boolean(blockedTip.value));

function minimize(options?: Parameters<typeof openWindow>[0]) {
  if (blocked.value) {
    if (!options?.auto) {
      TUIToast.info(t(blockedTip.value));
    }
    return;
  }
  return openWindow(options);
}

// Also watches `minimized`, so a window that finishes opening after the session starts still closes.
watch([blocked, minimized], ([isBlocked, isMinimized]) => {
  if (isBlocked && isMinimized) {
    close();
  }
});

defineExpose({ minimize, restore, dismissAuto });
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
