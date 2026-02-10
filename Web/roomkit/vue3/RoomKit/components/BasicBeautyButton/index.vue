<template>
  <div>
    <IconButton
      :title="t('BasicBeauty.Title')"
      :disabled="cameraList.length === 0"
      @click="handleClick"
    >
      <IconBasicBeauty :size="24" />
    </IconButton>

    <TUIDialog
      v-model:visible="basicBeautyVisible"
      :title="t('BasicBeauty.Title')"
      :custom-classes="['basic-beauty-dialog']"
      appendTo="#roomPage"
    >
      <FreeBeautyPanel @close="basicBeautyVisible = false" />
      <template #footer>
        <div />
      </template>
    </TUIDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconBasicBeauty, TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState, FreeBeautyPanel } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';

const { t } = useUIKit();

const { cameraList } = useDeviceState();

const basicBeautyVisible = ref(false);

const handleClick = () => {
  if (cameraList.value.length === 0) {
    TUIToast.error({ message: t('BasicBeauty.NoCamera') });
    return;
  }
  basicBeautyVisible.value = true;
};
</script>

<style lang="scss">
.basic-beauty-dialog {
  width: 600px;
}
</style>
