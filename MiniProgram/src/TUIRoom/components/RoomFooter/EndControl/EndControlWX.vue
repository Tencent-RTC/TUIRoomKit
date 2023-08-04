<template>
  <div class="end-control-container">
    <div class="end-button" tabindex="1" @click="stopMeeting">{{ t('End') }}</div>
  </div>
  <div v-if="visible" :class="showLeaveRoom === true ? 'end-dialog':'end-dialog-single'">
    <div v-if="currentDialogType === DialogType.BasicDialog">
      <div v-if="roomStore.isMaster" class="end-dialog-header">
        <span v-if="roomStore.isMaster" class="end-dialog-text">
          <!-- eslint-disable-next-line max-len -->
          {{ t('If you dont want to end the meeting, please designate a new host before leaving the meeting.') }}
        </span>
        <span v-else>{{ t('Are you sure you want to leave this room?') }}</span>
      </div>
    </div>
    <div v-if="currentDialogType === DialogType.BasicDialog">
      <button
        v-if="roomStore.isMaster"
        :class="showLeaveRoom === true ? 'end-button-dismiss':'end-button-dismiss-single'"
        @click.stop="dismissRoom"
      >
        {{ t('Dismiss') }}
      </button>
      <button
        v-if="showLeaveRoom"
        :class="roomStore.isMaster === true ?'end-button-leave':'end-button-leave-single'"
        @click="leaveRoom"
      >
        {{ t('Leave') }}
      </button>
      <button class="end-button-cancel" @click.stop="cancel">{{ t('Cancel') }}</button>
    </div>
    <div v-if="currentDialogType === DialogType.TransferDialog">
      <button class="end-button-cancel" @click.stop="cancel">{{ t('Cancel') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';
import { ElMessageBox, ElMessage } from '../../../elementComp';
import TUIRoomEngine, { TUIRole, TUIRoomEvents } from '@tencentcloud/tuiroom-engine-wx';
import useEndControl from './useEndControlHooks';

const {
  t,
  showLeaveRoom,
  roomStore,
  roomEngine,
  toggleMangeMemberSidebar,
  localUser,
  stopMeeting,
  cancel,
  selectedUser,
  DialogType,
  logPrefix,
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
    console.log(`${logPrefix}dismissRoom: enter`);
    await closeMediaBeforeLeave();
    await roomEngine.instance?.destroyRoom();
    resetState();
    emit('on-destroy-room', { code: 0, message: '' });
  } catch (error) {
    console.error(`${logPrefix}dismissRoom error:`, error);
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
      toggleMangeMemberSidebar();
      resetState();
      return;
    }
    await closeMediaBeforeLeave();
    const response = await roomEngine.instance?.exitRoom();
    console.log(`${logPrefix}leaveRoom:`, response);
    resetState();
    emit('on-exit-room', { code: 0, message: '' });
  } catch (error) {
    console.error(`${logPrefix}leaveRoom error:`, error);
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
    console.log(`${logPrefix}onRoomDismissed:`, roomId);
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
    console.error(`${logPrefix}onRoomDestroyed error:`, error);
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
  .end-control-container{
    .end-button {
      border: 2px solid #FF2E2E;
      border-radius: 4px;
      font-weight: 400;
      font-size: 12px;
      color: #FF2E2E;
      letter-spacing: 0;
      cursor: pointer;
      text-align: center;
      line-height: 21px;
      padding:  0 6px;
      &:hover {
        background-color: #FF2E2E;
        color: $whiteColor;
      }
    }
  }
    .end-dialog,.end-dialog-single {
      width: 90%;
      border-radius: 14px;
      position: fixed;
      bottom: 0;
      right: 25px;
      left: 25px;
      bottom: 10vh;
      z-index: 9;
    .manage-transfer{
      position: absolute;
      top: 0;
    }
      .end-dialog-header {
        background: #CACACB;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
        line-height: 17px;
        text-align: center;
        color: #6a6c74;
        height: 56px;
        width: 100%;
        margin: 0 auto;
        border-top-left-radius: 14px;
        border-top-right-radius: 14px;
        border-bottom: .5px solid #4f4e4e;
        display: flex;
        justify-content: center;
        align-items: center;
        .end-dialog-text {
          width: 230px;
        }
      }
        .end-button-dismiss,.end-button-leave,.end-button-cancel,.end-button-dismiss-single,.end-button-leave-single {
          width: 100%;
          font-family: 'PingFang SC';
          font-style: normal;
          font-weight: 400;
          font-size: 20px;
          line-height: 24px;
          text-align: center;
          color: #FF2E2E;
          border-style: none;
          background: #CACACB;
          padding: 20px;
        }
        .end-button-leave {
          color: #007AFF;
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
          border-top: .5px solid #8f8e8e;
        }
        .end-button-leave-single{
          position: absolute;
          bottom: 1vh;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .end-button-cancel {
          position: absolute;
          bottom: -9vh;
          left: 0;
          background-color: #FFFFFF;
          border-radius: 14px;
          color: #007AFF;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .end-button-dismiss-single {
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
    }
    .end-dialog-single {
      bottom: 12vh;
      .end-button-cancel{
        bottom: -9vh;
      }
    }
  </style>

