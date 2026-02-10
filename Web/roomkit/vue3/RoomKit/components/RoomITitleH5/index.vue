<template>
  <div
    v-if="currentRoom?.roomId"
    class="room-header"
    @click="isPopupVisible = true"
  >
    <div class="room-title">
      <div class="room-title-top">
        <span class="room-title-name">{{ currentRoom?.roomName || currentRoom?.roomId }}</span>
        <IconCaretDownSmall :size="24" class="room-title-icon" />
      </div>
      <span class="room-duration">{{ durationTime }}</span>
    </div>
  </div>

  <TUIPopup
    v-model:visible="isPopupVisible"
  >
    <PopUpArrowDown @click="isPopupVisible = false" />
    <CurrentRoomInfoH5 />
  </TUIPopup>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { IconCaretDownSmall, TUIPopup } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import PopUpArrowDown from '../base/PopUpArrowDown.vue';
import CurrentRoomInfoH5 from './CurrentRoomInfo.vue';

const { currentRoom } = useRoomState();

const isPopupVisible = ref(false);
const currentTime = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

const durationTime = computed(() => {
  if (!currentRoom.value?.roomId) {
    return '00:00';
  }

  const duration = currentTime.value - (currentRoom.value.createTime ?? 0);
  const totalSeconds = Math.floor(duration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

</script>

<style lang="scss" scoped>
.room-title {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-primary);
  min-width: 0;

  .room-title-top {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .room-title-name {
    max-width: 60vw;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .room-title-icon {
    flex-shrink: 0;
  }

  .room-duration {
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    text-align: center;
    flex-shrink: 0;
  }
}
</style>
