<template>
  <TUIDropdown
    trigger="click"
    placement="top"
    class="room-button"
  >
    <TUIButton
      class="button"
      size="large"
      type="primary"
      :icon="IconCreateRoom"
    >
      {{ t('Button.CreateRoom') }}
    </TUIButton>
    <template #dropdown>
      <div class="dropdown-content">
        <div class="dropdown-item" @click="() => handleStartRoom(RoomType.Standard)">
          <span>{{ t('Button.CreateConference') }}</span>
          <IconArrowStrokeRight size="12" />
        </div>
        <div class="dropdown-item" @click="() => handleStartRoom(RoomType.Webinar)">
          <span>{{ t('Button.CreateWebinar') }}</span>
          <IconArrowStrokeRight size="12" />
        </div>
      </div>
    </template>
  </TUIDropdown>
</template>

<script setup lang="ts">
import { IconArrowStrokeRight, IconCreateRoom, TUIButton, TUIDropdown, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { RoomType } from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();

const emit = defineEmits(['start-room']);

const handleStartRoom = (roomTRype: RoomType) => {
  emit('start-room', roomTRype);
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

.dropdown-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 10px;

  .dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 30px;
    gap: 8px;
    cursor: pointer;
    font-weight: 500;
    color: var(--text-color-primary);
  }

  .dropdown-item:hover {
    color: var(--button-color-primary-hover);
  }
}
</style>
