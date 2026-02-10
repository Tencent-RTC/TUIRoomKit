<template>
  <TUIButton
    color="red"
    :disabled="!currentRoom?.roomId"
    @click="handleLeaveRoom"
  >
    {{ t('Room.LeaveRoom') }}
  </TUIButton>

  <!-- Confirmation dialog for owner -->
  <TUIDialog
    v-model:visible="showConfirmDialog"
    :title="t('Room.ConfirmLeaveTitle')"
  >
    <div class="dialog-message">
      {{ dialogMessage }}
    </div>

    <template #footer>
      <div class="button-container">
        <TUIButton
          color="red"
          style="min-width: 88px"
          :loading="isEnding"
          @click="handleEndRoom"
        >
          {{ t('Room.EndRoom') }}
        </TUIButton>
        <TUIButton
          type="primary"
          style="min-width: 88px"
          @click="handleLeaveFromConfirmDialog"
        >
          {{ t('Room.LeaveRoom') }}
        </TUIButton>
        <TUIButton style="min-width: 88px" @click="showConfirmDialog = false">
          {{ t('Room.Cancel') }}
        </TUIButton>
      </div>
    </template>
  </TUIDialog>

  <!-- Transfer owner dialog -->
  <TUIDialog
    v-model:visible="showTransferDialog"
    :title="t('Room.SelectNewHost')"
  >
    <TUISelect
      v-model="selectedUserId"
      :placeholder="t('Room.PleaseSelectNewHost')"
      style="width: 100%"
    >
      <TUIOption
        v-for="participant in otherParticipants"
        :key="participant.userId"
        :label="participant.userName || participant.userId"
        :value="participant.userId"
      />
    </TUISelect>

    <template #footer>
      <div class="button-container">
        <TUIButton
          type="primary"
          style="min-width: 88px"
          :disabled="!selectedUserId"
          :loading="isTransferring"
          @click="handleTransferAndLeave"
        >
          {{ t('Room.TransferAndLeave') }}
        </TUIButton>
        <TUIButton style="min-width: 88px" @click="showTransferDialog = false">
          {{ t('Room.Cancel') }}
        </TUIButton>
      </div>
    </template>
  </TUIDialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  TUIButton,
  TUIDialog,
  TUISelect,
  TUIOption,
  TUIToast,
  useUIKit,
  TUIMessageBox,
} from '@tencentcloud/uikit-base-component-vue3';
import {
  RoomParticipantRole,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();
const emit = defineEmits(['leave', 'end']);

const {
  currentRoom,
  leaveRoom: leaveRoomStateApi,
  endRoom: endRoomStateApi,
} = useRoomState();
const { localParticipant, participantList, transferOwner } =
  useRoomParticipantState();

const showTransferDialog = ref(false);
const showConfirmDialog = ref(false);
const selectedUserId = ref<string>('');
const isTransferring = ref(false);
const isEnding = ref(false);

// Get other participants (excluding local user)
const otherParticipants = computed(() =>
  participantList.value.filter(
    participant => participant.userId !== localParticipant.value?.userId
  )
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
    !selectedUserId.value ||
    !currentRoom.value?.roomId ||
    isTransferring.value
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
      callback: action => {
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
.button-container {
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.dialog-message {
  padding: 16px 0;
  font-size: 14px;
  color: var(--text-color-primary);
}
</style>
