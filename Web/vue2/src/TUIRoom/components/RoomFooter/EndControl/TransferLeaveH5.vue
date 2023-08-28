<template>
  <div class="transfer-container">
    <div class="transfer-header">
      <input
        v-model="searchName"
        type="text"
        class="searching-input"
        :placeholder="t('Search for conference attendees')"
        enterkeyhint="done"
      >
    </div>
    <div class="transfer-body">
      <div
        v-for="user in filteredList"
        :key="user.userId"
        class="transfer-list-content"
        @click="handleShowMemberControl(user.userId)"
      >
        <div class="member-basic-info">
          <img class="avatar-url" :src="user.avatarUrl || defaultAvatar">
          <div class="user-name">{{ user.userName || user.userId }}</div>
          <img v-if="selectedUser === user.userId" class="correct" src="../../../assets/icons/svg/correct.svg" alt="">
        </div>
      </div>
      <div v-if="hasNoData" class="member-hasNoData">{{ t('No relevant user found.') }}</div>
      <div class="transfer-leave" @click="transferAndLeave">
        <button class="transfer-button">{{ t('Transfer and leave') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { ref, onUnmounted, computed } from 'vue';
import defaultAvatar from '../../../assets/imgs/avatar.png';
import { useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import { storeToRefs } from 'pinia';
import useEndControl from './useEndControlHooks';
import TUIRoomEngine, { TUIRole, TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import { ElMessageBox, ElMessage } from '../../../elementComp';
import logger from '../../../utils/common/logger';

const {
  t,
  roomEngine,
  logPrefix,
  closeMediaBeforeLeave,
  resetState,
} = useEndControl();

const roomStore = useRoomStore();
const basicStore = useBasicStore();
const { localUser, remoteAnchorList } = storeToRefs(roomStore);
const selectedUser = ref('');
const emit = defineEmits(['on-exit-room', 'on-destroy-room']);
const searchName = ref('');

const filteredList = computed(() => remoteAnchorList.value.filter(searchUser => (
  searchUser.userId.includes(searchName.value)) || (searchUser.userName?.includes(searchName.value))));

const hasNoData = computed(() => filteredList.value.length === 0);

function handleShowMemberControl(userId: string) {
  selectedUser.value = userId;
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
    resetState();
    emit('on-exit-room', { code: 0, message: '' });
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
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

<style lang="scss">
.transfer-container {
  height: 91vh;
  .transfer-header {
     input[type=text]{
        background-image: url(../../../assets/icons/svg/search.svg);
        background-repeat: no-repeat;
        background-position: 10px center;
        padding-left: 35px;
        background-color: var(--transfer-input-color-h5);
     }
        .searching-input {
        width: 93%;
        background: #292D38;
        border-radius: 8px;
        height: 34px;
        border-style: none;
        margin-left: 16px;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 450;
        font-size: 16px;
        line-height: 18px;
        color: #676c80;
        caret-color: var(--caret-color);
        ::placeholder {
          font-family: 'PingFang SC';
          font-style: normal;
          font-weight: 400;
          font-size: 16px;
          line-height: 18px;
          color: #676c80;
        }
        &:focus-visible {
         outline: none;
       }
      }
  }
  .transfer-body {
    flex: 1;
    overflow-y: scroll;
    .transfer-list-content{
      padding-bottom: 5px;
    .transfer-item-container {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 69px;
      justify-content: space-between;
      padding: 0 32px;
    }
    .member-basic-info {
        display: flex;
        position: relative;
        width: 100%;
        flex-direction: row;
        align-items: center;
        padding: 24px 20px 0 24px;
        .avatar-url {
          width: 40px !important;
          height: 40px !important;
          border-radius: 50%;
        }
        .user-name {
          margin-left: 9px;
          color: var(--input-font-color);
          max-width: 70% !important;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          font-family: 'PingFang SC';
          font-style: normal;
          font-weight: 500;
          font-size: 16px !important;
          line-height: 22px;
          letter-spacing: -0.24px;
          display: flex;
        }
        .correct {
          width: 24px;
          height: 24px;
          position: absolute;
          right: 5vw;
        }
      }
    }
    .member-hasNoData{
      position: fixed;
      top: 30%;
      left: 30%;
      width: 40vw;
      height: 5vh;
      color: var(--input-font-color);
      border-radius: 4px;
      background-color: var(--message-list-color);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .transfer-leave{
      position: fixed;
      bottom: 2vh;
      left: 7vw;
      display: flex;
      align-items: center;
      justify-content: center;
      .transfer-button{
        width: 86vw;
        height: 5vh;
        background: linear-gradient(315deg, #006EFF 0%, #0C59F2 98.81%);
        border-radius: 8px;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 500;
        font-size: 16px;
        line-height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: #FFFFFF;
        border-style: none;
      }
    }
  }
}
</style>
