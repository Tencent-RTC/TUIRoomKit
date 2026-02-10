<template>
  <div class="room-info">
    <div class="room-info-item">
      <div class="room-info-title">
        {{ currentRoom?.roomName || currentRoom?.roomId }}
      </div>
    </div>
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
        {{ t('CurrentRoomInfo.PasswordH5') }}
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

<script setup lang="ts">
import { computed } from 'vue';
import { IconCopy, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { useCopy } from '../../hooks/useCopy';
import { generateRoomLink } from '../../utils/utils';

const { t } = useUIKit();
const { currentRoom } = useRoomState();
const { copy } = useCopy();

const roomLink = computed(() => {
  if (!currentRoom.value?.roomId) {
    return '';
  }

  return generateRoomLink(currentRoom.value.roomId, currentRoom.value.password);
});

</script>

<style lang="scss" scoped>
.room-info {
  display: flex;
  flex-direction: column;
  padding: 12px 20px 20px 20px;
  background-color: var(--bg-color-dialog);
  border-radius: 16px;
  gap: 12px;
  color: var(--text-color-primary);
  -webkit-tap-highlight-color: transparent;

  .room-info-item {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 6px;
    font-size: 14px;

    .room-info-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color-primary);
      margin-bottom: 12px;
    }

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
