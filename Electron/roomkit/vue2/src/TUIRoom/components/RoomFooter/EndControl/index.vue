<template>
  <div class="end-control-container">
    <tui-button type="primary" class="end-button" @click="handleEndBtnClick">
      {{ showEndButtonContent }}
    </tui-button>
    <Dialog
      v-model="visible"
      :title="title"
      :modal="true"
      width="480px"
      :before-close="cancel"
      :close-on-click-modal="true"
      :append-to-room-container="true"
    >
      <div v-if="currentDialogType === DialogType.BasicDialog">
        <span>{{ showEndDialogContent }}</span>
      </div>
      <div v-if="currentDialogType === DialogType.TransferDialog">
        <div>{{ t('New host') }}</div>
        <div>
          <tui-select
            v-model="selectedUser"
            :teleported="false"
            :popper-append-to-body="false"
          >
            <tui-option
              v-for="user in remoteEnteredUserList"
              :key="user.userId"
              :value="user.userId"
              :label="user.nameCard || user.userName"
            />
          </tui-select>
        </div>
      </div>
      <template #footer>
        <div v-if="currentDialogType === DialogType.BasicDialog">
          <tui-button
            v-if="roomStore.isMaster"
            class="button"
            size="default"
            @click="dismissRoom"
          >
            {{ t('Dismiss') }}
          </tui-button>
          <tui-button
            class="button"
            size="default"
            @click="handleEndLeaveClick"
          >
            {{ t('Leave') }}
          </tui-button>
          <tui-button
            class="button"
            type="primary"
            size="default"
            @click="cancel"
          >
            {{ t('Cancel') }}
          </tui-button>
        </div>
        <div v-if="currentDialogType === DialogType.TransferDialog">
          <tui-button class="button" size="default" @click="transferAndLeave">
            {{ t('Transfer and leave') }}
          </tui-button>
          <tui-button
            class="button"
            size="default"
            type="primary"
            @click="cancel"
          >
            {{ t('Cancel') }}
          </tui-button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import TuiButton from '../../common/base/Button.vue';
import TuiSelect from '../../common/base/Select/index.vue';
import TuiOption from '../../common/base/Option/index.vue';
import Dialog from '../../common/base/Dialog/index.vue';
import { TUIRole } from '@tencentcloud/tuiroom-engine-electron';
import useEndControl from './useEndControlHooks';
import logger from '../../../utils/common/logger';
import { roomService } from '../../../services';

const {
  t,
  roomStore,
  roomEngine,
  stopMeeting,
  cancel,
  selectedUser,
  DialogType,
  showEndDialogContent,
  logPrefix,
  title,
  showEndButtonContent,
  currentDialogType,
  visible,
  resetState,
  isMasterWithOneRemoteUser,
  isMasterWithRemoteUser,
  remoteEnteredUserList,
} = useEndControl();

function handleEndBtnClick() {
  stopMeeting();
}
function handleEndLeaveClick() {
  if (
    !roomStore.isMaster ||
    (roomStore.isMaster && remoteEnteredUserList.value.length === 0)
  ) {
    leaveRoom();
    return;
  }
  if (isMasterWithRemoteUser.value) {
    selectedUser.value = remoteEnteredUserList.value[0].userId;
    if (isMasterWithOneRemoteUser.value) {
      transferAndLeave();
      return;
    }
    currentDialogType.value = DialogType.TransferDialog;
  }
}

/**
 * Active room dismissal
 **/
async function dismissRoom() {
  try {
    logger.log(`${logPrefix}dismissRoom: enter`);
    resetState();
    await roomService.dismissRoom();
  } catch (error) {
    logger.error(`${logPrefix}dismissRoom error:`, error);
  }
}

/**
 * Leave the room voluntarily
 **/
async function leaveRoom() {
  // eslint-disable-line
  try {
    resetState();
    await roomService.leaveRoom();
  } catch (error) {
    logger.error(`${logPrefix}leaveRoom error:`, error);
  }
}

async function transferAndLeave() {
  if (!selectedUser.value) {
    return;
  }
  try {
    const userId = selectedUser.value;
    const changeUserRoleResponse = await roomEngine.instance?.changeUserRole({
      userId,
      userRole: TUIRole.kRoomOwner,
    });
    logger.log(`${logPrefix}transferAndLeave:`, changeUserRoleResponse);
    resetState();
    await roomService.leaveRoom();
  } catch (error) {
    logger.error(`${logPrefix}transferAndLeave error:`, error);
  }
}
</script>
<style lang="scss" scoped>
.end-control-container {
  .end-button {
    padding: 9px 20px;
    font-size: 14px;
    border-radius: 20px;
    color: var(--text-color-error);
    border: 1.5px solid var(--text-color-error);

    &:hover {
      color: var(--uikit-color-white-1);
      background: var(--text-color-error);
      border: 1.5px solid var(--text-color-error);
    }
  }
}

.button {
  margin-left: 20px;
}
</style>
