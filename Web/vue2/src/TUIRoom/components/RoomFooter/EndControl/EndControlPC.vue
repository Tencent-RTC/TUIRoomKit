<template>
  <div class="end-control-container">
    <div class="end-button" tabindex="1" @click="stopMeeting">{{ t('EndPC') }}</div>
    <Dialog
      :model-value="visible"
      class="custom-element-class"
      :title="title"
      :modal="true"
      :append-to-body="false"
      width="420px"
      :before-close="cancel"
      :close-on-click-modal="true"
    >
      <div v-if="currentDialogType === DialogType.BasicDialog">
        <span v-if="roomStore.isMaster">
          <!-- eslint-disable-next-line max-len -->
          {{ t('You are currently the room host, please select the appropriate action.If you select "Leave Room", the room will not be dissolved and you will need to appoint a new host.') }}
        </span>
        <span v-else>{{ t('Are you sure you want to leave this room?') }}</span>
      </div>
      <div v-if="currentDialogType === DialogType.TransferDialog">
        <div>{{ t('New host') }}</div>
        <div>
          <el-select
            v-model="selectedUser"
            :teleported="false"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="user in remoteAnchorList"
              :key="user.userId"
              :value="user.userId"
              :label="user.userName"
            />
          </el-select>
        </div>
      </div>
      <template #footer>
        <div v-if="currentDialogType === DialogType.BasicDialog">
          <el-button v-if="roomStore.isMaster" type="primary" @click.stop="dismissRoom">
            {{ t('Dismiss') }}
          </el-button>
          <el-button v-if="showLeaveRoom" type="primary" @click="leaveRoom">{{ t('Leave') }}</el-button>
          <el-button @click.stop="cancel">{{ t('Cancel') }}</el-button>
        </div>
        <div v-if="currentDialogType === DialogType.TransferDialog">
          <el-button type="primary" @click="transferAndLeave">{{ t('Transfer and leave') }}</el-button>
          <el-button @click.stop="cancel">{{ t('Cancel') }}</el-button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';
import { ElMessageBox, ElMessage } from '../../../elementComp';
import Dialog from '../../../elementComp/Dialog';
import TUIRoomEngine, { TUIRole, TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import useEndControl from './useEndControlHooks';
import logger from '../../../utils/common/logger';

const {
  t,
  showLeaveRoom,
  roomStore,
  basicStore,
  roomEngine,
  localUser,
  remoteAnchorList,
  stopMeeting,
  cancel,
  selectedUser,
  DialogType,
  logPrefix,
  title,
  currentDialogType,
  visible,
  closeMediaBeforeLeave,
  resetState,
} = useEndControl();


const emit = defineEmits(['on-exit-room', 'on-destroy-room']);

/**
 * Active room dismissal
 *
 * 主动解散房间
**/
async function dismissRoom() {
  try {
    logger.log(`${logPrefix}dismissRoom: enter`);
    await closeMediaBeforeLeave();
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
 * 主动离开房间
**/
async function leaveRoom() { // eslint-disable-line
  try {
    if (roomStore.isMaster) {
      currentDialogType.value = DialogType.TransferDialog;
      return;
    }
    await closeMediaBeforeLeave();
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
    await closeMediaBeforeLeave();
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
 * 收到主持人解散房间通知
**/
const onRoomDismissed = async (eventInfo: { roomId: string}) => {
  try {
    const { roomId } = eventInfo;
    logger.log(`${logPrefix}onRoomDismissed:`, roomId);
    ElMessageBox.alert(t('The host closed the room.'), t('Note'), {
      customClass: 'custom-element-class',
      confirmButtonText: t('Confirm'),
      appendTo: '#roomContainer',
      callback: async () => {
        resetState();
        emit('on-destroy-room', { code: 0, message: '' });
      },
    });
  } catch (error) {
    logger.error(`${logPrefix}onRoomDestroyed error:`, error);
  }
};

/**
 * By listening for a change in ownerId,
 * the audience receives a notification that the host has handed over the privileges
 *
**/

const onUserRoleChanged = async (eventInfo: {userId: string, userRole: TUIRole }) => {
  if (eventInfo.userRole === TUIRole.kRoomOwner) {
    const { userId } = eventInfo;
    let newName = roomStore.getUserName(userId) || userId;
    if (userId === localUser.value.userId) {
      newName = t('me');
    }
    const tipMessage = `${t('Moderator changed to ')}${newName}`;
    ElMessage({
      type: 'success',
      message: tipMessage,
    });
    if (roomStore.localUser.userId === userId) {
      roomStore.setLocalUser({ userRole: TUIRole.kRoomOwner });
    } else {
      roomStore.setRemoteUserRole(userId, TUIRole.kRoomOwner);
    }
    roomStore.setMasterUserId(userId);
    resetState();
    if (roomStore.isAnchor) return;
    if (roomStore.isSpeakAfterTakingSeatMode) {
      await roomEngine.instance?.takeSeat({ seatIndex: -1, timeout: 0 });
    }
  }
};

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRoomDismissed, onRoomDismissed);
  roomEngine.instance?.on(TUIRoomEvents.onUserRoleChanged, onUserRoleChanged);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRoomDismissed, onRoomDismissed);
  roomEngine.instance?.off(TUIRoomEvents.onUserRoleChanged, onUserRoleChanged);
});

</script>
<style lang="scss" scoped>
@import '../../../assets/style/var.scss';
  .end-button {
    width: 90px;
    height: 40px;
    border: 2px solid #FF2E2E;
    border-radius: 4px;
    font-weight: 400;
    font-size: 14px;
    color: #FF2E2E;
    letter-spacing: 0;
    cursor: pointer;
    text-align: center;
    line-height: 36px;
    &:hover {
      background-color: #FF2E2E;
      color: $whiteColor;
    }
  }
</style>
