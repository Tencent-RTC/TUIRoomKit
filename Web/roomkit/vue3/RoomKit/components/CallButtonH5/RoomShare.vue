<template>
  <div class="room-share">
    <div v-if="!roomInfo" class="room-share-empty">
      {{ t('RoomShare.NoRoomInfo') }}
    </div>
    <div v-else class="room-share-content">
      <div class="share-item">
        <div class="share-label">
          {{ t('RoomShare.RoomName') }}
        </div>
        <div class="share-value">
          {{ roomInfo.roomName }}
        </div>
      </div>

      <div v-if="roomInfo.scheduledStartTime && roomInfo.scheduledEndTime" class="share-item">
        <div class="share-label">
          {{ t('RoomShare.RoomTime') }}
        </div>
        <div class="share-value">
          {{ formatDateTime(roomInfo.scheduledStartTime) }} - {{ formatDateTime(roomInfo.scheduledEndTime) }}
        </div>
      </div>

      <div class="share-item">
        <div class="share-label">
          {{ t('RoomShare.RoomId') }}
        </div>
        <div class="share-value">
          {{ roomInfo.roomId }}
          <IconCopy class="copy-icon" @click="() => copy(roomInfo?.roomId || '')" />
        </div>
      </div>

      <div v-if="roomInfo.password" class="share-item">
        <div class="share-label">
          {{ t('RoomShare.Password') }}
        </div>
        <div class="share-value">
          {{ roomInfo.password }}
          <IconCopy class="copy-icon" @click="() => copy(roomInfo?.password || '')" />
        </div>
      </div>

      <div class="share-item">
        <div class="share-label">
          {{ t('RoomShare.RoomLink') }}
        </div>
        <div class="share-value room-link">
          <span class="room-link-text">{{ roomLink }}</span>
          <IconCopy class="copy-icon" @click="() => copy(roomLink)" />
        </div>
      </div>

      <div class="share-actions">
        <TUIButton
          type="primary"
          size="large"
          class="copy-button"
          @click="copyRoomInfoAndLink"
        >
          {{ t('RoomShare.CopyMeetingIdAndLink') }}
        </TUIButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { IconCopy, TUIButton, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useCopy } from '../../hooks/useCopy';
import { generateRoomLink } from '../../utils/utils';
import type { RoomInfo } from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();
const { copy } = useCopy();

interface Props {
  roomInfo: RoomInfo | null;
}

const props = defineProps<Props>();

const formatDateTime = (timestamp?: number): string => {
  if (!timestamp) {
    return '--';
  }

  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const roomLink = computed(() => {
  if (!props.roomInfo?.roomId) {
    return '';
  }
  return generateRoomLink(props.roomInfo.roomId, props.roomInfo.password);
});

const copyRoomInfoAndLink = async () => {
  if (!props.roomInfo) {
    TUIToast.error({ message: t('RoomShare.NoRoomInfo') });
    return;
  }

  const roomInfoLines = [
    `${t('RoomShare.RoomName')}: ${props.roomInfo.roomName}`,
    `${t('RoomShare.RoomId')}: ${props.roomInfo.roomId}`,
    props.roomInfo.password ? `${t('RoomShare.Password')}: ${props.roomInfo.password}` : null,
    props.roomInfo.scheduledStartTime && props.roomInfo.scheduledEndTime ? `${t('RoomShare.RoomTime')}: ${formatDateTime(props.roomInfo.scheduledStartTime)} - ${formatDateTime(props.roomInfo.scheduledEndTime)}` : null,
    `${t('RoomShare.RoomLink')}: ${roomLink.value}`,
  ].filter(Boolean);

  const roomInfoText = roomInfoLines.join('\n');

  await copy(roomInfoText);
};
</script>

<style lang="scss" scoped>
.room-share {
  user-select: text;
  -webkit-tap-highlight-color: transparent;

  .room-share-empty {
    text-align: center;
    color: var(--text-color-secondary);
    padding: 40px 0;
  }

  .room-share-content {
    .share-item {
      display: flex;
      margin-bottom: 16px;
      align-items: flex-start;

      .share-label {
        min-width: 100px;
        color: var(--text-color-secondary);
        font-size: 14px;
        line-height: 22px;
        flex-shrink: 0;
      }

      .share-value {
        flex: 1;
        color: var(--text-color-primary);
        font-size: 14px;
        line-height: 22px;
        display: flex;
        align-items: center;
        gap: 8px;
        word-break: break-all;
        justify-content: space-between;

        &.room-link {
          cursor: pointer;
          min-width: 0;

          .room-link-text {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .copy-icon {
          cursor: pointer;
          color: var(--text-color-link);
          flex-shrink: 0;
        }
      }
    }

    .share-actions {
      margin-top: 32px;
      display: flex;
      justify-content: center;

      .copy-button {
        min-width: 200px;
      }
    }
  }
}
</style>
