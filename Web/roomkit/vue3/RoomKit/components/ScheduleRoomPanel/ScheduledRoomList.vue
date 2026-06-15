<template>
  <div
    ref="scrollContainer"
    class="schedule-room-list"
    @scroll="handleScroll"
  >
    <!-- Initial loading overlay -->
    <div v-if="isLoading && scheduledRoomList.length === 0" class="loading-overlay">
      <IconLoadingSchedule class="loading-icon" size="36" />
      <span class="loading-text">{{ t('ScheduleRoomPanel.Loading') }}</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="scheduledRoomList.length === 0 && !isLoading" class="schedule-room-list-empty">
      <IconApplyStageLabel size="48" />
      <span class="text">{{ t('ScheduleRoomPanel.NoScheduledRooms') }}</span>
    </div>

    <!-- Room list content -->
    <div
      v-for="(rooms, date) in groupedRoomsByDate"
      :key="date"
      class="schedule-room-list-content"
    >
      <div class="date-header">
        <IconTime />
        {{ date }}
      </div>
      <div
        v-for="room in rooms"
        :key="room.roomId"
        class="schedule-room-list-item"
      >
        <div class="item-left">
          <div class="room-header">
            {{ room.roomName }}
          </div>
          <div class="room-details">
            <div class="room-time room-details-item">
              {{ transferRoomTimeToHHMM(room.scheduledStartTime) }}
              -
              {{ transferRoomTimeToHHMM(room.scheduledEndTime) }}
            </div>
            |
            <div class="room-id room-details-item">
              {{ room.roomId }}
            </div>
            |
            <div :class="['room-status', room.roomStatus === RoomStatus.Running && 'running', 'room-details-item']">
              {{ transferRoomStatus(room.roomStatus || RoomStatus.Scheduled) }}
            </div>
          </div>
        </div>
        <div class="item-right">
          <Dropdown
            trigger="click"
            placement="bottom"
            :hideOnClick="true"
          >
            <IconHorizontalMore2 class="icon-button" />
            <template #dropdown>
              <div class="operate-list">
                <div class="operate-item" @click="() => viewDetail(room)">
                  {{ t('ScheduleRoomPanel.ViewDetails') }}
                </div>
                <div
                  v-if="room.roomOwner.userId === loginUserInfo?.userId && room.roomStatus === RoomStatus.Scheduled"
                  class="operate-item"
                  @click="() => handleEditRoom(room)"
                >
                  {{ t('ScheduleRoomPanel.EditRoom') }}
                </div>
                <div
                  v-if="room.roomOwner.userId === loginUserInfo?.userId && room.roomStatus === RoomStatus.Scheduled"
                  class="operate-item operate-item-error"
                  @click="() => cancelRoom(room)"
                >
                  {{ t('ScheduleRoomPanel.CancelRoom') }}
                </div>
              </div>
            </template>
          </Dropdown>
          <IconShareLinkIconH5 class="icon-button" @click="() => shareRoom(room)" />
          <TUIButton
            class="icon-button"
            type="primary"
            @click="handleJoinRoom(room)"
          >
            {{ t('ScheduleRoomPanel.Join') }}
          </TUIButton>
        </div>
      </div>
    </div>

    <!--  Load more indicator (for pagination) -->
    <div v-if="isLoading && scheduledRoomList.length > 0" class="loading-indicator">
      {{ t('ScheduleRoomPanel.Loading') }}
    </div>

    <!-- No more data hint -->
    <div v-if="scheduledRoomListCursor === '' && scheduledRoomList.length > 0 && !isLoading" class="no-more-data">
      {{ t('ScheduleRoomPanel.NoMoreData') }}
    </div>

    <TUIDialog
      v-model:visible="roomDetailVisible"
      :title="t('ScheduleRoomPanel.RoomDetails')"
      :custom-classes="['room-detail-dialog']"
    >
      <RoomDetail :room-info="selectedRoom" :is-loading-attendees="isLoadingAttendees" />
      <template #footer>
        <div class="room-detail-footer">
          <TUIButton type="primary" @click="() => handleJoinRoom(selectedRoom)">
            {{ t('ScheduleRoomPanel.JoinNow') }}
          </TUIButton>
          <TUIButton @click="handleInviteMembers">
            {{ t('ScheduleRoomPanel.InviteMembers') }}
          </TUIButton>
        </div>
      </template>
    </TUIDialog>
    <TUIDialog
      v-model:visible="roomShareVisible"
      :title="`${loginUserInfo?.userName || loginUserInfo?.userId} ${t('ScheduleRoomPanel.InvitesToJoin')}`"
      :custom-classes="['room-share-dialog']"
    >
      <RoomShare :room-info="selectedRoom" />
      <template #footer>
        <div />
      </template>
    </TUIDialog>
    <TUIDialog
      v-model:visible="roomEditVisible"
      :cancel-text="t('ScheduleRoomPanel.Cancel')"
      :confirm-text="t('ScheduleRoomPanel.Confirm')"
      :title="t('ScheduleRoomPanel.EditRoom')"
      :custom-classes="['room-edit-dialog']"
    >
      <RoomEdit
        :room-info="selectedRoom"
        @cancel="handleCloseEditDialog"
        @save="handleSaveRoom"
      />
      <template #footer>
        <div />
      </template>
    </TUIDialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { Dropdown, IconApplyStageLabel, IconHorizontalMore2, IconLoadingSchedule, IconShareLinkIconH5, IconTime, TUIButton, TUIDialog, TUIMessageBox, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomStatus } from 'tuikit-atomicx-vue3';
import { useRoomModal } from 'tuikit-atomicx-vue3/room';
import RoomDetail from './RoomDetail.vue';
import RoomEdit from './RoomEdit.vue';
import RoomShare from './RoomShare.vue';
import { diffArray } from './utils';
import type { EditFormData } from './type';
import type { RoomInfo, RoomUser } from 'tuikit-atomicx-vue3';

const { t } = useUIKit();
const { handleErrorWithModal } = useRoomModal();

const emit = defineEmits<{
  joinRoom: [roomInfo: RoomInfo];
}>();

const transferRoomTimeToYYMMDD = (time?: number) => {
  if (!time) {
    return '0000-00-00';
  }
  const date = new Date(time * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const transferRoomTimeToHHMM = (time?: number): string => {
  if (!time) {
    return '00:00';
  }

  const date = new Date(time * 1000);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};
const transferRoomStatus = (roomStatus: RoomStatus) => {
  switch (roomStatus) {
    case RoomStatus.Scheduled:
      return t('ScheduleRoomPanel.NotStarted');
    case RoomStatus.Running:
      return t('ScheduleRoomPanel.InProgress');
    default:
      return t('ScheduleRoomPanel.UnknownStatus');
  }
};

const { loginUserInfo } = useLoginState();
const {
  scheduledRoomListCursor,
  scheduledRoomList,
  getRoomInfo,
  getScheduledRoomList,
  cancelScheduledRoom,
  updateScheduledRoom,
  getScheduledAttendees,
  addScheduledAttendees,
  removeScheduledAttendees,
} = useRoomState();
const roomDetailVisible = ref(false);
const roomShareVisible = ref(false);
const roomEditVisible = ref(false);
const selectedRoom = ref<RoomInfo | null>(null);

const isLoading = ref(false);
const scrollContainer = ref<HTMLElement>();

const groupedRoomsByDate = computed(() => {
  const sortedRooms = [...scheduledRoomList.value].sort((a, b) => (a.scheduledStartTime || 0) - (b.scheduledStartTime || 0));

  const groups: Record<string, RoomInfo[]> = {};
  sortedRooms.forEach((room) => {
    const dateKey = transferRoomTimeToYYMMDD(room.scheduledStartTime);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(room);
  });

  return groups;
});

const handleJoinRoom = (room: RoomInfo | null) => {
  if (!room?.roomId) {
    return;
  }
  emit('joinRoom', room);
};

const loadMoreRooms = async () => {
  if (isLoading.value || scheduledRoomListCursor.value === '') {
    return;
  }

  isLoading.value = true;

  try {
    await getScheduledRoomList({
      cursor: scheduledRoomListCursor.value,
    });
  } catch (error) {
    console.error('Load more rooms failed:', error);
    TUIToast.error({ message: t('ScheduleRoomPanel.LoadMoreRoomsFailed') });
  } finally {
    isLoading.value = false;
  }
};

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = target;

  if (scrollHeight - scrollTop - clientHeight < 50 && !isLoading.value && scheduledRoomListCursor.value !== '') {
    loadMoreRooms();
  }
};

// Initialize room list
const initializeRoomList = async () => {
  isLoading.value = true;

  try {
    await getScheduledRoomList({ cursor: '' });
  } catch (error) {
    console.error('Initialize room list failed:', error);
    TUIToast.error({ message: t('ScheduleRoomPanel.LoadRoomListFailed') });
  } finally {
    isLoading.value = false;
  }
};

// Fetch all attendees for a room
const fetchAllAttendees = async (roomId: string): Promise<RoomUser[]> => {
  let allAttendees: RoomUser[] = [];
  let currentCursor = '0';

  do {
    const { attendees, cursor } = await getScheduledAttendees({ roomId, cursor: currentCursor });
    allAttendees = allAttendees.concat(attendees);
    currentCursor = cursor;
  } while (currentCursor !== '');

  return allAttendees;
};

const isLoadingAttendees = ref(false);

const viewDetail = async (room: RoomInfo) => {
  selectedRoom.value = room;
  roomDetailVisible.value = true;
  isLoadingAttendees.value = true;
  try {
    const { password = '' } = await getRoomInfo({ roomId: room.roomId });
    const allAttendees = await fetchAllAttendees(room.roomId);
    selectedRoom.value = {
      ...room,
      password,
      scheduleAttendees: allAttendees,
    };
  } catch (error: any) {
    handleErrorWithModal(error);
    throw error;
  } finally {
    isLoadingAttendees.value = false;
  }
};

const handleInviteMembers = () => {
  roomDetailVisible.value = false;
  roomShareVisible.value = true;
};

const shareRoom = async (room: RoomInfo) => {
  try {
    const { password = '' } = await getRoomInfo({ roomId: room.roomId });
    selectedRoom.value = {
      ...room,
      password,
    };
    roomShareVisible.value = true;
  } catch (error: any) {
    handleErrorWithModal(error);
    throw error;
  }
};

const cancelRoom = (room: RoomInfo) => {
  TUIMessageBox.confirm({
    type: 'warning',
    title: t('ScheduleRoomPanel.CancelBookedRoom'),
    content: t('ScheduleRoomPanel.CancelRoomWarning'),
    confirmText: t('ScheduleRoomPanel.CancelRoom'),
    cancelText: t('ScheduleRoomPanel.NotCancelNow'),
    callback: async (action?: string) => {
      if (action === 'confirm') {
        try {
          await cancelScheduledRoom({ roomId: room.roomId });
          TUIToast.success({ message: t('ScheduleRoomPanel.CancelRoomSuccess') });
        } catch (error) {
          console.error('Cancel room failed:', error);
          TUIToast.error({ message: t('ScheduleRoomPanel.CancelRoomFailed') });
        }
      }
    },
  });
};

const handleEditRoom = async (room: RoomInfo) => {
  roomEditVisible.value = true;
  const allAttendees = await fetchAllAttendees(room.roomId);

  selectedRoom.value = {
    ...scheduledRoomList.value.find(item => item.roomId === room.roomId) || room,
    scheduleAttendees: allAttendees,
  };
};

const handleCloseEditDialog = () => {
  roomEditVisible.value = false;
  selectedRoom.value = null;
};

const handleSaveRoom = (editData: EditFormData) => {
  updateScheduledRoom({
    roomId: editData.roomId,
    options: {
      roomName: editData.roomName,
      scheduleStartTime: editData.scheduleStartTime,
      scheduleEndTime: editData.scheduleEndTime,
    },
  });
  const originalAttendees = (selectedRoom.value?.scheduleAttendees || []).map(attendee => ({
    key: attendee.userId,
  }));

  const currentAttendees = editData.scheduleAttendees.map(userId => ({
    key: userId,
  }));
  const diff = diffArray(originalAttendees, currentAttendees);
  if (diff.added.length > 0) {
    addScheduledAttendees({
      roomId: editData.roomId,
      userIdList: diff.added.map(item => item.key),
    });
  }

  if (diff.removed.length > 0) {
    removeScheduledAttendees({
      roomId: editData.roomId || '',
      userIdList: diff.removed.map(item => item.key),
    });
  }
  TUIToast.success({ message: t('ScheduleRoomPanel.RoomUpdatedSuccess') });
  handleCloseEditDialog();
};

// Initialize on component mount
onMounted(() => {
  isLoading.value = true;
  if (loginUserInfo.value?.userId) {
    initializeRoomList();
  }
});

// Re-initialize when user login state changes
watch(() => loginUserInfo.value?.userId, (userId) => {
  if (userId) {
    initializeRoomList();
  }
});

</script>

<style lang="scss" scoped>
.schedule-room-list {
  height: 100%;
  overflow-y: auto;
  position: relative;
  text-align: initial;
}

.loading-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;

  .loading-icon {
    animation: loading-rotate 1s linear infinite;
  }

  .loading-text {
    margin-top: 10px;
    font-size: 14px;
    font-style: normal;
    color: var(--text-color-secondary);
  }
}

.schedule-room-list-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .text {
    margin-top: 10px;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    color: var(--text-color-secondary);
  }
}

.schedule-room-list-content {
  display: flex;
  flex-direction: column;

  .date-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 14px;
    font-weight: 400;
    color: var(--text-color-secondary);
    padding: 10px;
    gap: 8px;
  }

  .schedule-room-list-item {
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    padding: 10px;

    .item-left {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
      min-width: 0;
      color: var(--text-color-primary);

      .room-header {
        font-weight: 500;
        font-size: 16px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .room-details {
        font-size: 14px;
        font-weight: 400;
        color: var(--text-color-primary);
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 6px;

        .room-details-item {
          min-width: 0;
          text-align: center;
        }

        .room-id {
          min-width: 60px;
          max-width: 84px;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .room-status.running {
          color: var(--text-color-success);
        }
      }
    }

    .item-right {
      display: flex;
      flex-direction: row;
      align-items: center;
      color: var(--uikit-color-theme-6);

      .icon-button {
        padding: 10px;
      }
    }
  }

  .schedule-room-list-item:hover {
    cursor: pointer;
    background-color: var(--list-color-hover);
    border-radius: 8px;
  }
}

.room-detail-footer {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.no-more-data {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: var(--text-color-secondary);
  font-size: 12px;
}

:deep(.room-detail-dialog) {
  width: 540px;
}

.operate-list {
  display: flex;
  flex-direction: column;
}

.operate-item {
  display: flex;
  justify-content: center;
  color: var(--text-color-primary);
  font-size: 14px;
  cursor: pointer;
  padding: 8px;
}

.operate-item:hover {
  color: var(--text-color-link-hover);
}

.operate-item-error {
  color: var(--text-color-error) !important;
}

@keyframes loading-rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
