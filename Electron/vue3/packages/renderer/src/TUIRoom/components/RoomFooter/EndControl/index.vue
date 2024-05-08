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
          <tui-select v-model="selectedUser" :teleported="false" :popper-append-to-body="false" theme="white">
            <tui-option
              v-for="user in remoteUserList"
              :key="user.userId"
              :value="user.userId"
              :label="user.userName"
              theme="white"
            />
          </tui-select>
        </div>
      </div>
      <template #footer>
        <div v-if="currentDialogType === DialogType.BasicDialog">
          <tui-button v-if="roomStore.isMaster" class="button" size="default" @click="dismissRoom">
            {{ t('Dismiss') }}
          </tui-button>
          <tui-button v-if="isShowLeaveRoomDialog" class="button" size="default" @click="handleEndLeaveClick">
            {{ t('Leave') }}
          </tui-button>
          <tui-button class="button" type="primary" size="default" @click="cancel">
            {{ t('Cancel') }}
          </tui-button>
        </div>
        <div v-if="currentDialogType === DialogType.TransferDialog">
          <tui-button class="button" size="default" @click="transferAndLeave">
            {{ t('Transfer and leave') }}
          </tui-button>
          <tui-button class="button" size="default" type="primary" @click="cancel">
            {{ t('Cancel') }}
          </tui-button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';
import TuiButton from '../../common/base/Button.vue';
import TuiSelect from '../../common/base/Select.vue';
import TuiOption from '../../common/base/Option.vue';
import Dialog from '../../common/base/Dialog/index.vue';
import TUIRoomEngine, { TUIRole, TUIRoomEvents } from '@tencentcloud/tuiroom-engine-electron';
import useEndControl from './useEndControlHooks';
import logger from '../../../utils/common/logger';
import TUIMessageBox from '../../common/base/MessageBox/index';

const {
  t,
  isShowLeaveRoomDialog,
  roomStore,
  basicStore,
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
  closeMediaBeforeLeave,
  resetState,
  isMasterWithOneRemoteUser,
  isMasterWithRemoteUser,
  remoteUserList,
} = useEndControl();

const emit = defineEmits(['on-exit-room', 'on-destroy-room']);

function handleEndBtnClick() {
  stopMeeting();
}
function handleEndLeaveClick() {
  if (!roomStore.isMaster) {
    leaveRoom();
    return;
  }
  if (isMasterWithRemoteUser.value) {
    selectedUser.value = remoteUserList.value[0].userId;
    if (isMasterWithOneRemoteUser.value) {
      transferAndLeave();
      return;
    }
    currentDialogType.value = DialogType.TransferDialog;
  }
}

/**
 * Active room dismissal
 *
 **/
async function dismissRoom() {
  try {
    logger.log(`${logPrefix}dismissRoom: enter`);
    closeMediaBeforeLeave();
    await roomEngine.instance?.destroyRoom();
    resetState();
    emit('on-destroy-room', { code: 0, message: '' });
  } catch (error) {
    logger.error(`${logPrefix}dismissRoom error:`, error);
  }
}

/**
 * Leave the room voluntarily
 *
 **/
async function leaveRoom() {
  // eslint-disable-line
  try {
    closeMediaBeforeLeave();
    const response = await roomEngine.instance?.exitRoom();
    logger.log(`${logPrefix}leaveRoom:`, response);
    resetState();
    emit('on-exit-room', { code: 0, message: '' });
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
    const changeUserRoleResponse = await roomEngine.instance?.changeUserRole({ userId, userRole: TUIRole.kRoomOwner });
    logger.log(`${logPrefix}transferAndLeave:`, changeUserRoleResponse);
    closeMediaBeforeLeave();
    const exitRoomResponse = await roomEngine.instance?.exitRoom();
    logger.log(`${logPrefix}exitRoom:`, exitRoomResponse);
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    resetState();
    emit('on-exit-room', { code: 0, message: '' });
  } catch (error) {
    logger.error(`${logPrefix}transferAndLeave error:`, error);
  }
}

/**
 * notification of room dismissal from the host
 *
 **/
const onRoomDismissed = async (eventInfo: { roomId: string }) => {
  try {
    const { roomId } = eventInfo;
    logger.log(`${logPrefix}onRoomDismissed:`, roomId);
    TUIMessageBox({
      title: t('Note'),
      message: t('The host closed the room.'),
      confirmButtonText: t('Sure'),
      callback: async () => {
        resetState();
        emit('on-destroy-room', { code: 0, message: '' });
      },
    });
  } catch (error) {
    logger.error(`${logPrefix}onRoomDestroyed error:`, error);
  }
};

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRoomDismissed, onRoomDismissed);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRoomDismissed, onRoomDismissed);
});
</script>
<style lang="scss" scoped>
.end-control-container {
  .end-button {
    padding: 9px 20px;
    font-size: 14px;
    border-radius: 20px;
    border: 1.5px solid var(--red-color-2);
    color: var(--red-color-2);
    &:hover {
      background: var(--red-color-2);
      color: var(--font-color-7);
      border: 1px solid var(--red-color-2);
    }
  }
}
.button {
  margin-left: 20px;
}
</style>
