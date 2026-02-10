<template>
  <div>
    <IconButton
      :title="t('VirtualBackground.Title')"
      :disabled="!isSupported() || cameraList.length === 0"
      @click="handleClick"
    >
      <IconVirtualBackground :size="24" />
    </IconButton>

    <TUIDialog
      v-model:visible="virtualBackgroundVisible"
      :title="t('VirtualBackground.Title')"
      :custom-classes="['virtual-background-dialog']"
      appendTo="#roomPage"
    >
      <VirtualBackgroundPanel @close="virtualBackgroundVisible = false" />
      <template #footer>
        <div />
      </template>
    </TUIDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconVirtualBackground, TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState, useVirtualBackgroundState, VirtualBackgroundPanel } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';

const { t } = useUIKit();

const virtualBackgroundVisible = ref(false);

const { isSupported } = useVirtualBackgroundState();
const { cameraList } = useDeviceState();

const handleClick = () => {
  if (cameraList.value.length === 0) {
    TUIToast.error({ message: t('VirtualBackground.NoCamera') });
    return;
  }
  if (!isSupported()) {
    TUIToast.error({ message: t('VirtualBackground.NotSupported') });
    return;
  }

  virtualBackgroundVisible.value = true;
};
</script>

<style lang="scss">
.virtual-background-dialog {
  width: 600px;
}
</style>
