<template>
  <div v-if="currentRoom?.roomId" class="room-header">
    <TUIDropdown
      trigger="click"
      placement="bottom"
      :hideOnClick="false"
      :teleported="false"
    >
      <div class="room-title">
        <span class="room-title-name">{{ currentRoom?.roomName || currentRoom?.roomId }}</span>
        <IconCaretDownSmall :size="24" class="room-title-icon" />
        <span class="room-duration">{{ durationTime }}</span>
      </div>
      <template #dropdown>
        <div class="room-info">
          <div class="room-info-item">
            <div class="room-info-label">
              {{ t('CurrentRoomInfo.Host') }}
            </div>
            <div class="room-info-value">
              {{ currentRoom?.roomOwner.userName || currentRoom?.roomOwner.userId }}
            </div>
          </div>
          <div class="room-info-item">
            <div class="room-info-label">
              {{ t('CurrentRoomInfo.RoomId') }}
            </div>
            <div class="room-info-value">
              {{ currentRoom?.roomId }}
            </div>
            <div class="room-info-copy" @click="() => copy(currentRoom?.roomId || '')">
              <IconCopy class="copy-icon" />
              <span>{{ t('CurrentRoomInfo.Copy') }}</span>
            </div>
          </div>
          <div v-if="currentRoom?.password" class="room-info-item">
            <div class="room-info-label">
              {{ t('CurrentRoomInfo.Password') }}
            </div>
            <div class="room-info-value">
              {{ currentRoom?.password }}
            </div>
            <div class="room-info-copy" @click="() => copy(currentRoom?.password || '')">
              <IconCopy class="copy-icon" />
              <span>{{ t('CurrentRoomInfo.Copy') }}</span>
            </div>
          </div>
          <div class="room-info-item">
            <div class="room-info-label">
              {{ t('CurrentRoomInfo.RoomLink') }}
            </div>
            <div class="room-info-value">
              {{ roomLink }}
            </div>
            <div class="room-info-copy" @click="() => copy(roomLink)">
              <IconCopy class="copy-icon" />
              <span>{{ t('CurrentRoomInfo.Copy') }}</span>
            </div>
          </div>
        </div>
      </template>
    </TUIDropdown>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { TUIDropdown, IconCaretDownSmall, IconCopy, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { conference } from '../../adapter/conference';
import { useCopy } from '../../hooks/useCopy';
import { generateRoomLink } from '../../utils/utils';

const { t } = useUIKit();
const { currentRoom } = useRoomState();
const { copy } = useCopy();

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

const roomLink = computed(() => {
  const customLink = conference.getFeatureConfig('shareLink');
  if (customLink) {
    return customLink;
  }
  if (!currentRoom.value?.roomId) {
    return '';
  }
  return generateRoomLink(currentRoom.value.roomId, currentRoom.value.password, currentRoom.value.roomType);
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
  height: 100%;
  gap: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
  min-width: 0;

  .room-title-name {
    max-width: 300px;
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
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    text-align: center;
    flex-shrink: 0;
  }
}

.room-info {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: var(--bg-color-dialog);
  border-radius: 16px;
  gap: 12px;

  .room-info-item {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 6px;
    font-size: 14px;

    .room-info-label {
      min-width: 80px;
      color: var(--text-color-secondary);
      font-size: 14px;
      line-height: 22px;
      flex-shrink: 0;
      text-align: start;
    }

    .room-info-value {
      flex: 1;
      color: var(--text-color-primary);
      font-size: 14px;
      line-height: 22px;
      gap: 8px;
      text-align: start;
      word-break: break-all;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
    }
  }
}

.room-info-copy {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-color-link);
  cursor: pointer;

  .copy-icon {
    flex-shrink: 0;

    &:hover {
      color: var(--text-color-link-hover);
    }
  }
}
</style>
