<template>
  <div class="local-screen-container" ref="localScreenContainerRef">
    <div :class="['local-screen-control-container', { mini: isMiniRegion }]">
      <div class="local-screen-info">
        <IconScreenSharing size="44" />
        <span class="text">{{ t('RoomView.YouAreSharingTheScreen') }}</span>
      </div>
      <TUIButton color="red" @click="handleStopSharing" type="primary">
        {{ t('RoomView.EndSharing') }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import {
  TUIButton,
  IconScreenSharing,
  TUIMessageBox,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();
const { stopScreenShare } = useDeviceState();
const localScreenContainerRef = ref();
const isMiniRegion = ref(false);

function handleStopSharing() {
  TUIMessageBox.confirm({
      title: t('ScreenShare.EndSharing'),
      content: t('ScreenShare.StopSharingConfirm'),
      callback: async (action: string) => {
        if (action === 'confirm') {
          await stopScreenShare();
        }
      },
    });
}

const resizeObserver = new ResizeObserver(() => {
  isMiniRegion.value = localScreenContainerRef.value?.offsetHeight <= 200;
});
onMounted(() => {
  resizeObserver.observe(localScreenContainerRef.value);
});
onBeforeUnmount(() => {
  resizeObserver.unobserve(localScreenContainerRef.value);
  resizeObserver.disconnect();
});
</script>

<style lang="scss" scoped>
.local-screen-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--bg-color-bubble-reciprocal);

  &::before {
    width: 100%;
    height: 100%;
    content: '';
    background-color: var(--bg-color-bubble-reciprocal);
  }

  .local-screen-control-container {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translate(-50%, -50%);
    color: var(--text-color-tertiary);

    &.mini {
      transform: translate(-50%, -50%) scale(0.7);
    }

    .local-screen-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;

      .text {
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: 24px;
        white-space: nowrap;
      }
    }
  }
}
</style>
