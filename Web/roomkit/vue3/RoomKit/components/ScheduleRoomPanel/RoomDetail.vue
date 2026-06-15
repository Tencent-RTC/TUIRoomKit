<template>
  <div class="room-detail">
    <div v-if="!roomInfo" class="room-detail-empty">
      {{ t('ScheduleRoomPanel.NoRoomInfo') }}
    </div>
    <div v-else class="room-detail-content">
      <div class="detail-item">
        <div class="detail-label">
          {{ t('ScheduleRoomPanel.RoomName') }}
        </div>
        <div class="detail-value">
          {{ roomInfo.roomName }}
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-label">
          {{ t('ScheduleRoomPanel.RoomID') }}
        </div>
        <div class="detail-value">
          {{ roomInfo.roomId }}
          <IconCopy class="copy-icon" @click="() => copy(roomInfo?.roomId || '')" />
        </div>
      </div>

      <div v-if="roomInfo.password" class="detail-item">
        <div class="detail-label">
          {{ t('ScheduleRoomPanel.RoomPassword') }}
        </div>
        <div class="detail-value">
          {{ roomInfo.password }}
          <IconCopy class="copy-icon" @click="() => copy(roomInfo?.password || '')" />
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-label">
          {{ t('ScheduleRoomPanel.RoomTime') }}
        </div>
        <div class="detail-value">
          {{ formatDateTime(roomInfo.scheduledStartTime) }} - {{ formatDateTime(roomInfo.scheduledEndTime) }}
          <span v-if="roomInfo.roomStatus" :class="['status-badge', roomInfo.roomStatus === RoomStatus.Running && 'running']">
            {{ getRoomStatusText(roomInfo.roomStatus) }}
          </span>
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-label">
          {{ t('ScheduleRoomPanel.Creator') }}
        </div>
        <div class="detail-value">
          {{ roomInfo.roomOwner.userName || roomInfo.roomOwner.userId }}
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-label">
          {{ t('ScheduleRoomPanel.Attendees') }}
        </div>
        <div class="detail-value">
          <div v-if="isLoadingAttendees" class="attendees-loading">
            <IconLoadingSchedule class="loading-icon" size="16" />
            <span>{{ t('ScheduleRoomPanel.Loading') }}</span>
          </div>
          <div
            v-else-if="roomInfo.scheduleAttendees && roomInfo.scheduleAttendees.length > 0"
            class="attendees-list"
            :title="roomInfo.scheduleAttendees.map((attendee) => attendee.userName || attendee.userId).join(', ')"
          >
            {{ roomInfo.scheduleAttendees.map((attendee) => attendee.userName || attendee.userId).join(', ') }}
          </div>
          <div v-else class="no-attendees">
            {{ t('ScheduleRoomPanel.NoScheduledMembers') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { IconCopy, IconLoadingSchedule, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { RoomStatus } from 'tuikit-atomicx-vue3';
import { useCopy } from './useCopy';
import type { RoomInfo } from 'tuikit-atomicx-vue3';

const { t } = useUIKit();
const { copy } = useCopy();
interface Props {
  roomInfo: RoomInfo | null;
  isLoadingAttendees?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLoadingAttendees: false,
});

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

const getRoomStatusText = (status: RoomStatus): string => {
  switch (status) {
    case RoomStatus.Scheduled:
      return t('ScheduleRoomPanel.NotStarted');
    case RoomStatus.Running:
      return t('ScheduleRoomPanel.InProgress');
    default:
      return t('ScheduleRoomPanel.UnknownStatus');
  }
};

</script>

<style lang="scss" scoped>
.room-detail {
  padding: 20px 0;
  user-select: text;
  text-align: initial;

  .room-detail-empty {
    text-align: center;
    color: var(--text-color-secondary);
    padding: 40px 0;
  }

  .room-detail-content {
    .detail-item {
      display: flex;
      margin-bottom: 20px;

      .detail-label {
        min-width: 80px;
        color: var(--text-color-secondary);
        font-size: 14px;
        line-height: 22px;
      }

      .detail-value {
        flex: 1;
        color: var(--text-color-primary);
        font-size: 14px;
        line-height: 22px;
        display: flex;
        align-items: center;
        gap: 8px;

        .copy-icon {
          cursor: pointer;
          color: var(--text-color-link);

          &:hover {
            color: var(--text-color-link-hover);
          }
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          background-color: var(--background-color-secondary);
          color: var(--text-color-secondary);

          &.running {
            background-color: var(--background-color-success);
            color: var(--text-color-success);
          }
        }
      }
    }

    .attendees-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-color-secondary);

      .loading-icon {
        animation: rotate 1s linear infinite;
      }

      @keyframes rotate {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }

    .attendees-list {
      display: flex;
      flex-direction: row;
      gap: 8px;
      max-height: 66px; // 3 lines * 22px line-height
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      word-break: break-all;

      .attendee-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .attendee-name {
          font-size: 14px;
        }
      }
    }

    .no-attendees {
      color: var(--text-color-secondary);
      font-style: italic;
    }
  }
}
</style>
