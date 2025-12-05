<template>
  <div class="room-button">
    <TUIButton
      class="button"
      size="large"
      type="primary"
      :icon="IconCreateRoom"
      @click="handleStartRoom"
    >
      {{ t('Button.CreateRoom') }}
    </TUIButton>
  </div>
</template>

<script setup lang="ts">
import { IconCreateRoom, TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();

const emit = defineEmits(['start-room']);

const handleStartRoom = () => {
  emit('start-room');
};
</script>

<style lang="scss" scoped>
.room-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;

  .button {
    width: 100%;
    height: 100%;
  }
}
</style>
