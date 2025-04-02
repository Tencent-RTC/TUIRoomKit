<template>
  <div class="end-control-container">
    <TUIButton color="red" size="large" @click="handleEndBtnClick">
      {{ showEndButtonContent }}
    </TUIButton>
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
          <TUIButton
            v-if="roomStore.isMaster"
            @click="dismissRoom"
            type="primary"
            style="min-width: 88px"
          >
            {{ t('Dismiss') }}
          </TUIButton>
          <TUIButton
            @click="handleEndLeaveClick"
            type="primary"
            style="min-width: 88px"
          >
            {{ t('Leave') }}
          </TUIButton>
          <TUIButton @click="cancel" style="min-width: 88px">
            {{ t('Cancel') }}
          </TUIButton>
        </div>
        <div v-if="currentDialogType === DialogType.TransferDialog">
          <TUIButton
            @click="transferAndLeave"
            type="primary"
            style="min-width: 88px"
          >
            {{ t('Transfer and leave') }}
          </TUIButton>
          <TUIButton @click="cancel" style="min-width: 88px">
            {{ t('Cancel') }}
          </TUIButton>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import TuiSelect from '../../common/base/Select';
import TuiOption from '../../common/base/Option';
import Dialog from '../../common/base/Dialog';
import { TUIRole } from '@tencentcloud/tuiroom-engine-js';
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
