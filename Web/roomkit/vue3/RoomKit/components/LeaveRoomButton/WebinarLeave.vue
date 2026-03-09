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
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  TUIButton,
  TUIDialog,
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

interface Props {
  emitFunction: (event: 'leave' | 'end') => void;
}
const props = defineProps<Props>();

const {
  currentRoom,
  leaveRoom: leaveRoomStateApi,
  endRoom: endRoomStateApi,
} = useRoomState();
const {
  localParticipant,
  participantList,
} = useRoomParticipantState();

const showConfirmDialog = ref(false);
const isEnding = ref(false);

// Get other participants (excluding local user)
const otherParticipants = computed(() =>
  participantList.value.filter(
    participant => participant.userId !== localParticipant.value?.userId,
  ),
);
const dialogMessage = computed(() => {
  if (otherParticipants.value.length === 0) {
    return t('Room.WebinarLeaveRoomTip');
  }
  return t('Room.WebinarConfirmLeaveTip');
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
    props.emitFunction('leave');
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
    props.emitFunction('end');
    showConfirmDialog.value = false;
  } catch (_error) {
    TUIToast.error({ message: t('Room.EndRoomFailed') });
  } finally {
    isEnding.value = false;
  }
};

// Handle leave from confirmation dialog
const handleLeaveFromConfirmDialog = () => {
  performLeave();
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
