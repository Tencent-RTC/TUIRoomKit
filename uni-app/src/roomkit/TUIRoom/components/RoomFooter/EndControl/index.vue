<template>
  <div>
    <div class="end-control-container">
      <div class="end-button" tabindex="1" @tap="handleEndBtnClick">
        <svg-icon style="display: flex" icon="EndRoomIcon" size="20" color="red" />
        <text class="end-button-title">{{ t('EndH5') }}</text>
      </div>
    </div>
    <div v-if="visible" class="end-main-content">
      <div :class="isShowLeaveRoomDialog ? 'end-dialog-leave' : 'end-dialog-dismiss'">
        <div v-if="currentDialogType === DialogType.BasicDialog">
          <div v-if="roomStore.isMaster" class="end-dialog-header">
            <text v-if="roomStore.isMaster" class="end-dialog-text">
              {{ t('If you do not want to end the meeting, please designate a new host before leaving the meeting.') }}
            </text>
            <text v-else>{{ t('Are you sure you want to leave this room?') }}</text>
          </div>
        </div>
        <div v-if="currentDialogType === DialogType.BasicDialog" class="dialog-middle-content">
          <text
            v-if="roomStore.isMaster"
            :class="isShowLeaveRoomDialog ? 'end-button-dismiss' : 'end-button-dismiss-single'"
            @click.stop="dismissRoom"
          >
            {{ t('Dismiss') }}
          </text>
          <text
            v-if="isShowLeaveRoomDialog"
            :class="roomStore.isMaster ? 'end-button-leave' : 'end-button-leave-single'"
            @tap="handleEndLeaveClick"
          >
            {{ t('Leave') }}
          </text>
          <text class="end-button-cancel" @click.stop="cancel">{{ t('Cancel') }}</text>
        </div>
        <div v-if="currentDialogType === DialogType.TransferDialog">
          <text class="end-button-cancel" @click.stop="cancel">{{ t('Cancel') }}</text>
        </div>
      </div>
    </div>
    <popup v-if="showSideBar" :title="t('Appoint a new host')" class="transfer-container">
      <template #sidebarContent>
        <div style="height: 1440rpx">
          <div class="transfer-list-container">
            <div class="transfer-header">
              <div class="search-container">
                <svg-icon style="display: flex" icon="SearchIcon"></svg-icon>
                <input
                  v-model="searchName"
                  type="text"
                  class="searching-input"
                  :placeholder="t('Search for conference attendees')"
                  enterkeyhint="done"
                />
              </div>
            </div>
            <div class="transfer-body">
              <scroll-view class="scroll-view" scroll-y="true">
                <div
                  v-for="user in filteredList"
                  :key="user.userId"
                  class="transfer-list-content"
                  @click="handleShowMemberControl(user.userId)"
                >
                  <div class="member-basic-info">
                    <div class="avatar-url">
                      <Avatar :img-src="user.avatarUrl"></Avatar>
                    </div>
                    <text class="user-name">{{ user.userName || user.userId }}</text>
                  </div>
                  <svg-icon
                    v-if="selectedUser === user.userId"
                    icon="CorrectIcon"
                    color="#006EFF"
                  ></svg-icon>
                </div>
              </scroll-view>
              <div v-if="hasNoData" class="member-hasNoData">
                <div class="no-data-region">
                  <text class="no-data-text">{{ t('No relevant user found.') }}</text>
                </div>
              </div>
            </div>
            <div class="transfer-leave" @click="transferAndLeave">
              <div class="transfer-button">
                <text class="transfer-text">{{ t('Transfer and leave') }}</text>
              </div>
            </div>
          </div>
        </div>
      </template>
    </popup>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';

import { TUIRoomEngine, TUIRole, TUIRoomEvents } from '@tencentcloud/tuiroom-engine-uniapp-app';
import useEndControl from './useEndControlHooks';
import logger from '../../../utils/common/logger';
import popup from '../../common/base/PopUpH5.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import Avatar from '../../common/Avatar.vue';
import TUIMessageBox from '../../common/base/MessageBox/index';
import { roomService } from '../../../services';

const {
  t,
  isShowLeaveRoomDialog,
  roomStore,
  basicStore,
  roomEngine,
  stopMeeting,
  cancel,
  DialogType,
  logPrefix,
  currentDialogType,
  visible,
  resetState,
  toggleMangeMemberSidebar,
  searchName,
  hasNoData,
  handleShowMemberControl,
  filteredList,
  selectedUser,
  showSideBar,
  remoteUserList,
  isMasterWithOneRemoteUser,
  isMasterWithRemoteUser,
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
    toggleMangeMemberSidebar();
    resetState();
    return;
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
    resetState();
    await roomService.dismissRoom();
  } catch (error) {
    logger.error(`${logPrefix}dismissRoom error:`, error);
  }
}

/**
 * Leave the room voluntarily
 *
 * 主动离开房间
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
    const changeUserRoleResponse = await roomEngine.instance?.changeUserRole({ userId, userRole: TUIRole.kRoomOwner });
    logger.log(`${logPrefix}transferAndLeave:`, changeUserRoleResponse);
    await roomService.leaveRoom();
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
const onRoomDismissed = async (eventInfo: { roomId: string }) => {
  try {
    const { roomId } = eventInfo;
    logger.log(`${logPrefix}onRoomDismissed:`, roomId);
    TUIMessageBox({
      title: t('Note'),
      message: t('The host closed the room.'),
      showCancel: false,
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
    display: flex;
    align-items: center;
    flex-direction: row;
    .end-button-title {
      font-weight: 400;
      line-height: 21px;
      font-size: 12px;
      color: #ff2e2e;
      margin-left: 3px;
    }
  }
}
.dialog-middle-content {
  width: 750rpx;
  display: flex;
  flex-direction: column;
}
.end-main-content {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 750rpx;
  background-color: rgba(0, 0, 0, 0.7);
  .end-dialog-leave,
  .end-dialog-dismiss {
    border-radius: 14px;
    position: fixed;
    right: 0;
    left: 0;
    bottom: 144rpx;
    z-index: 9;
    .manage-transfer {
      position: absolute;
      top: 0;
    }
    .end-dialog-header {
      background: #cacacb;
      height: 56px;
      width: 750rpx;
      border-top-left-radius: 14px;
      border-top-right-radius: 14px;
      border-bottom: 0.5px solid #4f4e4e;
      display: flex;
      justify-content: center;
      align-items: center;
      .end-dialog-text {
        width: 230px;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 500;
        font-size: 14px;
        line-height: 17px;
        text-align: center;
        color: #6a6c74;
      }
    }
    .end-button-dismiss,
    .end-button-leave,
    .end-button-cancel,
    .end-button-dismiss-single,
    .end-button-leave-single {
      width: 750rpx;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 400;
      font-size: 20px;
      line-height: 24px;
      text-align: center;
      color: #ff2e2e;
      background: #cacacb;
      padding: 20px 0;
    }
    .end-button-leave {
      color: #007aff;
      border-bottom-left-radius: 14px;
      border-bottom-right-radius: 14px;
      border-top: 0.5px solid #8f8e8e;
    }
    .end-button-leave-single {
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .end-button-cancel {
      position: fixed;
      bottom: 5px;
      left: 0;
      background-color: #ffffff;
      border-radius: 14px;
      color: #007aff;
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
}
.transfer-container {
  position: fixed;
  left: 0;
  top: 0;
  height: 1440rpx;
  z-index: 102;
  .transfer-list-container {
    position: relative;
    height: 1440rpx;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .transfer-header {
    display: flex;
    flex-direction: row;
    justify-content: center;
    padding: 0 16px;
    .search-container {
      height: 34px;
      border-radius: 8px;
      background-color: #d4d4d4;
      display: flex;
			flex-direction: row;
      padding: 0 16px;
      color: #676c80;
      flex: 1;
      align-items: center;
      .searching-input {
        flex: 1;
      }
    }
  }
  .transfer-body {
    flex: 1;
    display: flex;
    margin-top: 20px;
    flex-direction: column;
    align-items: stretch;
    .scroll-view {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: stretch;
    }
    .transfer-list-content {
      padding-bottom: 5px;
      margin-bottom: 10px;
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 69px;
      justify-content: space-between;
      padding: 0 32px;
      .member-basic-info {
        display: flex;
        position: relative;
        flex: 1;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        .avatar-url {
          width: 40px !important;
          height: 40px !important;
          border-radius: 50%;
        }
        .user-name {
          flex: 1;
          margin-left: 9px;
          color: #000000;
          text-overflow: ellipsis;
          overflow: hidden;
          font-family: 'PingFang SC';
          font-style: normal;
          font-weight: 500;
          font-size: 16px !important;
          line-height: 22px;
          lines: 1;
        }
      }
      .correct {
        position: absolute;
        right: 5px;
      }
    }
    .member-hasNoData {
      margin-top: 30px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      .no-data-region {
        background-color: #F6F6F6;
        width: 200px;
        border-radius: 4px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        .no-data-text {
          color: #000000;
        }
      }
    }
  }
}
.transfer-leave {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  margin-top: 10px;
  .transfer-button {
    width: 300px;
    height: 40px;
    background: #006eff;
    border-radius: 8px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    .transfer-text {
      color: #FFFFFF;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 16px;
      line-height: 22px;
    }
  }
}
</style>
