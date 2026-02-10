<template>
  <div
    v-if="currentRoom?.roomId"
    class="end-room-button"
    @click="handleLeaveRoom"
  >
    <IconEndRoom size="20" />
    <span>{{ t('Room.End') }}</span>
  </div>

  <!-- Confirmation dialog for owner -->
  <TUIPopup
    v-model:visible="showConfirmDialog"
    :title="t('Room.ConfirmLeaveTitle')"
  >
    <div class="popup-container">
      <PopUpArrowDown @click="showConfirmDialog = false" />
      <div class="popup-content">
        <div class="popup-message">
          {{ dialogMessage }}
        </div>

        <div class="button-container">
          <div class="button-item end-room" @click="handleEndRoom">
            {{ t('Room.EndRoom') }}
          </div>
          <div
            class="button-item leave-room"
            @click="handleLeaveFromConfirmDialog"
          >
            {{ t('Room.LeaveRoom') }}
          </div>
        </div>
      </div>
    </div>
  </TUIPopup>

  <!-- Transfer owner dialog -->
  <TUIPopup
    v-model:visible="showTransferDialog"
    :title="t('Room.SelectNewHost')"
    height="90%"
  >
    <div class="popup-container">
      <PopUpArrowDown @click="showTransferDialog = false" />
      <div class="popup-content">
        <div class="popup-title">
          {{ t('Room.PleaseSelectNewHost') }}
        </div>
        <div class="participant-list">
          <div
            v-for="participant in otherParticipants"
            :key="participant.userId"
            class="participant-item"
            @click="handleParticipantClick(participant.userId)"
          >
            <Avatar :src="participant.avatarUrl" :size="40" />
            <div class="user-info">
              <span>{{ participant.userName || participant.userId }}</span>
              <div
                v-if="selectedUserId === participant.userId"
                class="selected-indicator"
              >
                <input checked type="checkbox">
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="popup-footer">
        <TUIButton
          type="primary"
          style="min-width: 100%"
          size="large"
          :disabled="!selectedUserId"
          :loading="isTransferring"
          @click="handleTransferAndLeave"
        >
          {{ t('Room.TransferAndLeave') }}
        </TUIButton>
      </div>
    </div>
  </TUIPopup>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  TUIButton,
  TUIToast,
  useUIKit,
  IconEndRoom,
  TUIPopup,
  TUIMessageBox,
} from '@tencentcloud/uikit-base-component-vue3';
import {
  Avatar,
  RoomParticipantRole,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import PopUpArrowDown from '../base/PopUpArrowDown.vue';

const { t } = useUIKit();
const emit = defineEmits(['leave', 'end']);

const {
  currentRoom,
  leaveRoom: leaveRoomStateApi,
  endRoom: endRoomStateApi,
} = useRoomState();
const { localParticipant, participantList, transferOwner }
  = useRoomParticipantState();

const showTransferDialog = ref(false);
const showConfirmDialog = ref(false);
const selectedUserId = ref<string>('');
const isTransferring = ref(false);
const isEnding = ref(false);

// Get other participants (excluding local user)
const otherParticipants = computed(() =>
  participantList.value.filter(
    participant => participant.userId !== localParticipant.value?.userId,
  ),
);
const dialogMessage = computed(() => {
  if (otherParticipants.value.length === 0) {
    return t('Room.LeaveRoomTip');
  }
  return t('Room.ConfirmLeaveTip');
});

const leaveRoom = async () => {
  try {
    return await leaveRoomStateApi();
  } catch (_error: any) {
    if (_error.code === TUIErrorCode.ERR_INVALID_PARAMETER) {
      return Promise.resolve();
    }
    throw _error;
  }
};

const endRoom = async () => {
  try {
    return await endRoomStateApi();
  } catch (_error: any) {
    if (_error.code === TUIErrorCode.ERR_INVALID_PARAMETER) {
      return Promise.resolve();
    }
    throw _error;
  }
};
// Perform leave room action
const performLeave = async () => {
  try {
    if (!currentRoom.value?.roomId) {
      return;
    }

    await leaveRoom();
    emit('leave');
  } catch (_error) {
    TUIToast.error({ message: t('Room.LeaveRoomFailed') });
  }
};

// Handle end room (from confirmation dialog)
const handleEndRoom = async () => {
  if (!currentRoom.value?.roomId || isEnding.value) {
    return;
  }

  try {
    isEnding.value = true;
    await endRoom();
    showConfirmDialog.value = false;
    emit('end');
  } catch (_error) {
    TUIToast.error({ message: t('Room.EndRoomFailed') });
  } finally {
    isEnding.value = false;
  }
};

const handleParticipantClick = (userId: string) => {
  if (selectedUserId.value === userId) {
    selectedUserId.value = '';
    return;
  }
  selectedUserId.value = userId;
};

// Auto transfer and leave (for case 4: only one other participant)
const autoTransferAndLeave = async () => {
  if (otherParticipants.value.length !== 1 || !currentRoom.value?.roomId) {
    return;
  }

  try {
    const targetParticipant = otherParticipants.value[0];

    await transferOwner({ userId: targetParticipant.userId });
    await leaveRoom();

    emit('leave');
  } catch (_error) {
    TUIToast.error({ message: t('Room.TransferAndLeaveFailed') });
  }
};

// Handle leave from confirmation dialog
const handleLeaveFromConfirmDialog = () => {
  showConfirmDialog.value = false;

  // If owner is alone, just leave directly
  if (otherParticipants.value.length === 0) {
    performLeave();
    return;
  }

  // Case 4: If only one other participant, auto transfer and leave
  if (otherParticipants.value.length === 1) {
    autoTransferAndLeave();
    return;
  }

  // Case 3: Multiple participants, show transfer dialog
  showTransferDialog.value = true;
  selectedUserId.value = '';
};

// Handle transfer owner and leave (from transfer dialog for case 3)
const handleTransferAndLeave = async () => {
  if (
    !selectedUserId.value
    || !currentRoom.value?.roomId
    || isTransferring.value
  ) {
    return;
  }

  try {
    isTransferring.value = true;

    await transferOwner({ userId: selectedUserId.value });

    await leaveRoom();

    showTransferDialog.value = false;
    emit('leave');
  } catch (_error) {
    TUIToast.error({ message: t('Room.TransferAndLeaveFailed') });
  } finally {
    isTransferring.value = false;
  }
};

const handleLeaveRoom = () => {
  if (!currentRoom.value?.roomId) {
    return;
  }

  const isOwner = localParticipant.value?.role === RoomParticipantRole.Owner;

  // Case 1: Normal participant (non-owner) - leave directly
  if (!isOwner) {
    TUIMessageBox.confirm({
      title: t('Room.ConfirmLeaveTitle'),
      content: t('Room.ConfirmLeaveRoom'),
      callback: (action) => {
        if (action === 'confirm') {
          performLeave();
        }
      },
    });
    return;
  }

  // Case 2 & 3 & 4: Owner - always show confirmation dialog first
  showConfirmDialog.value = true;
};
</script>

<style lang="scss" scoped>
.end-room-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color-error);
}

.participant-list {
  display: flex;
  flex-direction: column;
  font-size: 16px;
  font-weight: 400;
  -webkit-tap-highlight-color: transparent;
  gap: 8px;

  .participant-item {
    display: flex;
    align-items: center;
    height: 50px;
    gap: 12px;
    box-sizing: border-box;

    .user-info {
      border-bottom: 1px solid var(--stroke-color-secondary);
      width: 100%;
      height: 100%;
      align-items: center;
      display: flex;
      justify-content: space-between;
    }

    .selected-indicator {
    }
  }
}

.button-container {
  padding-bottom: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;

  .button-item {
    text-align: center;
    border-bottom: 1px solid var(--stroke-color-secondary);
    padding: 8px;
    font-size: 16px;
    font-weight: 500;

    &.end-room {
      color: var(--text-color-error);
    }

    &.leave-room {
      color: var(--button-color-primary-default);
    }
  }
}

.popup-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

.popup-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 12px 16px;

  .popup-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-color-primary);
    margin-bottom: 20px;
  }

  .popup-message {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-color-secondary);
    text-align: center;
    margin-bottom: 20px;
  }
}

.popup-footer {
  width: 100%;
  flex-shrink: 0;
  padding: 20px;
  box-sizing: border-box;
}
</style>
