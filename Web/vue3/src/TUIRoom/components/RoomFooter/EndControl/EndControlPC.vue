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
            theme="white"
          >
            <tui-option
              v-for="user in remoteAnchorList"
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
import Dialog from '../../common/base/Dialog';
import TUIRoomEngine, { TUIRole, TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import useEndControl from './useEndControlHooks';
import logger from '../../../utils/common/logger';
import TUIMessage from '../../common/base/Message/index';
import TUIMessageBox from '../../common/base/MessageBox/index';

const {
  t,
  isShowLeaveRoomDialog,
  roomStore,
  basicStore,
  roomEngine,
  localUser,
  remoteAnchorList,
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
  isMasterWithOneRemoteAnchor,
  isMasterWithRemoteAnchors,
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
  if (isMasterWithRemoteAnchors.value) {
    selectedUser.value = remoteAnchorList.value[0].userId;
    if (isMasterWithOneRemoteAnchor.value) {
      transferAndLeave();
      return;
    }
    currentDialogType.value = DialogType.TransferDialog;
  }
}

/**
 * Active room dismissal
 *
 * 主动解散房间
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
 * 主动离开房间
**/
async function leaveRoom() { // eslint-disable-line
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
 * 收到主持人解散房间通知
**/
const onRoomDismissed = async (eventInfo: { roomId: string}) => {
  try {
    const { roomId } = eventInfo;
    logger.log(`${logPrefix}onRoomDismissed:`, roomId);
    TUIMessageBox({
      title: t('Note'),
      message: t('The host closed the room.'),
      appendToRoomContainer: true,
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

/**
 * By listening for a change in ownerId,
 * the audience receives a notification that the host has handed over the privileges
 *
**/
const onUserRoleChanged = async (eventInfo: {userId: string, userRole: TUIRole }) => {
  const { userId, userRole } = eventInfo;
  if (roomStore.localUser.userId === userId) {
    roomStore.setLocalUser({ userRole });
    if (eventInfo.userRole === TUIRole.kGeneralUser) {
      if (roomStore?.isCameraDisableForAllUser && !roomStore.localStream.hasAudioStream) {
        roomStore.setCanControlSelfAudio(false);
      }
      if (roomStore?.isMicrophoneDisableForAllUser && !roomStore.localStream.hasVideoStream) {
        roomStore.setCanControlSelfVideo(false);
      }
    } else if (eventInfo.userRole === TUIRole.kAdministrator) {
      TUIMessage({
        type: 'success',
        message: t('You are now an administrator'),
      });
      roomStore.setCanControlSelfAudio(true);
      roomStore.setCanControlSelfVideo(true);
    }
  } else {
    roomStore.setRemoteUserRole(userId, userRole);
  }
  if (eventInfo.userRole === TUIRole.kRoomOwner) {
    let newName = roomStore.getUserName(userId) || userId;
    if (userId === localUser.value.userId) {
      newName = t('me');
    }
    const tipMessage = `${t('Moderator changed to ')}${newName}`;
    TUIMessage({
      type: 'success',
      message: tipMessage,
    });
    roomStore.setMasterUserId(userId);
    resetState();
    if (roomStore.isAnchor) return;
    if (roomStore.localUser.userId === userId && roomStore.isSpeakAfterTakingSeatMode) {
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
.end-control-container{
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
