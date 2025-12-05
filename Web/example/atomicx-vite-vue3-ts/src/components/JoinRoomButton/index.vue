<template>
  <div class="room-button">
    <TUIButton
      v-if="!inputVisible"
      class="button"
      type="primary"
      size="large"
      :icon="IconEnterRoom"
      @click="showInput"
    >
      {{ t('Button.JoinRoom') }}
    </TUIButton>
    <TUIInput
      v-else
      v-model="roomId"
      size="large"
      :placeholder="t('Button.EnterRoomId')"
      class="input"
      :border="false"
      @done="handleJoinRoom"
    >
      <template #suffix>
        <IconEnterRoom
          size="24"
          class="icon-button"
          @click="handleJoinRoom"
        />
      </template>
    </TUIInput>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconEnterRoom, TUIButton, TUIInput, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();

const emit = defineEmits(['join-room']);

const inputVisible = ref(false);
const roomId = ref('');

const showInput = () => {
  inputVisible.value = true;
};

const handleJoinRoom = () => {
  emit('join-room', roomId.value);
};

</script>

<style lang="scss" scoped>
.room-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;

  .button,.input {
    width: 100%;
    height: 100%;
  }

  .input {
    align-items: center;
    display: flex;
    border: 2px solid var(--button-color-primary-default);
    border-radius: var(--tui-button-round-radius);
    padding: 0 16px;
  }

  .icon-button {
  }
}
</style>
