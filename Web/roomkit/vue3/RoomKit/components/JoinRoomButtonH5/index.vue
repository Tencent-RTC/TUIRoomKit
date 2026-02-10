<template>
  <div class="room-button">
    <TUIButton
      class="button"
      size="large"
      type="primary"
      :icon="IconEnterRoom"
      @click="handleStartRoom"
    >
      {{ t('Button.JoinRoom') }}
    </TUIButton>
  </div>
</template>

<script setup lang="ts">
import { IconEnterRoom, TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();

const emit = defineEmits(['join-room']);

const handleStartRoom = () => {
  emit('join-room');
};
</script>

<style lang="scss" scoped>
.room-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;

  .button {
    width: 100%;
    height: 100%;
  }
}
</style>
