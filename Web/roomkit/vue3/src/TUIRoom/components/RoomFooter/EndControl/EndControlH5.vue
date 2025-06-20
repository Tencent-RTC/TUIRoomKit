<template>
  <div>
    <div class="end-control-container">
      <div v-tap="handleEndBtnClick" class="end-button" tabindex="1">
        <IconEndRoom size="20" />
        <span class="end-button-title">{{ t('EndH5') }}</span>
      </div>
    </div>
    <div v-if="visible" class="end-main-content">
      <div class="end-dialog-dismiss">
        <div v-if="currentDialogType === DialogType.BasicDialog">
          <div v-if="roomStore.isMaster" class="end-dialog-header">
            <span v-if="roomStore.isMaster" class="end-dialog-text">
              {{
                t(
                  'If you do not want to end the meeting, please designate a new host before leaving the meeting.'
                )
              }}
            </span>
            <span v-else>{{
              t('Are you sure you want to leave this room?')
            }}</span>
          </div>
        </div>
        <div
          v-if="currentDialogType === DialogType.BasicDialog"
          class="dialog-middle-content"
        >
          <span
            v-if="roomStore.isMaster"
            class="end-button-dismiss"
            @click.stop="dismissRoom"
          >
            {{ t('Dismiss') }}
          </span>
          <span
            v-tap="handleEndLeaveClick"
            :class="
              roomStore.isMaster
                ? 'end-button-leave'
                : 'end-button-leave-single'
            "
          >
            {{ t('Leave') }}
          </span>
          <span class="end-button-cancel" @click.stop="cancel">{{
            t('Cancel')
          }}</span>
        </div>
        <div v-if="currentDialogType === DialogType.TransferDialog">
          <span class="end-button-cancel" @click.stop="cancel">{{
            t('Cancel')
          }}</span>
        </div>
      </div>
    </div>
    <popup
      v-show="showSideBar"
      :title="t('Appoint a new host')"
      class="transfer-container"
    >
      <template #sidebarContent>
        <div style="height: 100%">
          <div class="transfer-list-container">
            <div class="transfer-header">
              <div class="search-container">
                <IconSearch size="20" />
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
              <div
                v-for="user in filteredList"
                :key="user.userId"
                class="transfer-list-content"
                @click="handleShowMemberControl(user.userId)"
              >
                <div class="member-basic-info">
                  <Avatar class="avatar-url" :img-src="user.avatarUrl" />
                  <div class="user-name">
                    {{ roomService.getDisplayName(user) }}
                  </div>
                  <IconCorrect
                    v-if="selectedUser === user.userId"
                    class="correct"
                  />
                </div>
              </div>
              <div v-if="hasNoData" class="member-has-no-data">
                {{ t('No relevant user found.') }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #sidebarFooter>
        <div class="transfer-leave" @click="transferAndLeave">
          <span class="transfer-button">{{ t('Transfer and leave') }}</span>
        </div>
      </template>
    </popup>
  </div>
</template>

<script setup lang="ts">
import { TUIRole } from '@tencentcloud/tuiroom-engine-js';
import {
  IconCorrect,
  IconSearch,
  IconEndRoom,
} from '@tencentcloud/uikit-base-component-vue3';
import useEndControl from './useEndControlHooks';
import logger from '../../../utils/common/logger';
import popup from '../../common/base/PopUpH5.vue';
import Avatar from '../../common/Avatar.vue';
import vTap from '../../../directives/vTap';
import { roomService } from '../../../services';

const {
  t,
  roomStore,
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
  remoteEnteredUserList,
  isMasterWithOneRemoteUser,
  isMasterWithRemoteUser,
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
    toggleMangeMemberSidebar();
    resetState();
    return;
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
    display: flex;
    font-size: 12px;
    font-weight: 400;
    line-height: 21px;
    text-align: center;
    letter-spacing: 0;
    cursor: pointer;
    color: var(--text-color-error);

    .end-button-title {
      margin-left: 3px;
      white-space: nowrap;
    }
  }
}

.dialog-middle-content {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.end-main-content {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  width: 100vw;
  height: auto;
  background-color: var(--uikit-color-black-3);

  .end-dialog-leave,
  .end-dialog-dismiss {
    position: fixed;
    right: 0;
    bottom: 10vh;
    left: 0;
    z-index: 9;
    width: 90%;
    margin: auto;
    border-radius: 14px;

    .manage-transfer {
      position: absolute;
      top: 0;
    }

    .end-dialog-header {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 56px;
      margin: 0 auto;
      font-family: 'PingFang SC';
      font-size: 14px;
      font-style: normal;
      font-weight: 500;
      line-height: 17px;
      text-align: center;
      border-top-left-radius: 14px;
      border-top-right-radius: 14px;
      background-color: var(--bg-color-operate);
      color: var(--text-color-secondary);
      border-bottom: 0.5px solid var(--stroke-color-primary);

      .end-dialog-text {
        width: 230px;
      }
    }

    .end-button-dismiss,
    .end-button-leave,
    .end-button-cancel,
    .end-button-leave-single {
      width: 100%;
      padding: 20px 0;
      font-family: 'PingFang SC';
      font-size: 20px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px;
      text-align: center;
      border-style: none;
      background-color: var(--bg-color-operate);
      color: var(--text-color-error);
    }

    .end-button-leave {
      border-bottom-right-radius: 14px;
      border-bottom-left-radius: 14px;
      border-top: 0.5px solid var(--stroke-color-module);
      color: var(--text-color-link);
    }

    .end-button-leave-single {
      position: absolute;
      bottom: 1vh;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
    }

    .end-button-cancel {
      position: absolute;
      bottom: -9vh;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      border-radius: 14px;
      color: var(--text-color-link);
    }
  }

  .end-dialog-dismiss {
    bottom: 12vh;

    .end-button-cancel {
      bottom: -9vh;
    }
  }
}

.transfer-container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 102;
  height: 100vh;

  .transfer-list-container {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .transfer-header {
    display: flex;
    justify-content: center;
    padding: 0 16px;

    .search-container {
      display: flex;
      flex: 1;
      align-items: center;
      height: 34px;
      padding: 0 16px;
      border-radius: 8px;
      background-color: var(--bg-color-input);
      color: var(--text-color-secondary);

      .searching-input {
        width: 100%;
        background: none;
        border: none;
        outline: none;

        ::placeholder {
          font-size: 16px;
          line-height: 18px;
          color: var(--uikit-color-gray-7);
        }

        &:focus-visible {
          outline: none;
        }
      }
    }
  }

  .transfer-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    margin-top: 20px;
    overflow-y: scroll;

    .transfer-list-content {
      padding-bottom: 5px;

      .transfer-item-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        height: 69px;
        padding: 0 32px;
      }

      .member-basic-info {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        padding: 24px 20px 0 24px;

        .avatar-url {
          width: 40px !important;
          height: 40px !important;
          border-radius: 50%;
        }

        .user-name {
          display: flex;
          max-width: 70% !important;
          margin-left: 9px;
          overflow: hidden;
          font-family: 'PingFang SC';
          font-size: 16px !important;
          font-style: normal;
          line-height: 22px;
          text-overflow: ellipsis;
          letter-spacing: -0.24px;
          white-space: nowrap;
          color: var(--text-color-primary);
        }

        .correct {
          position: absolute;
          right: 5vw;
          background-size: cover;
        }
      }
    }

    .member-has-no-data {
      position: fixed;
      top: 30%;
      left: 30%;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40vw;
      height: 5vh;
      border-radius: 4px;
      color: var(--text-color-secondary);
    }
  }
}

.transfer-leave {
  position: fixed;
  bottom: 2vh;
  left: 7vw;
  display: flex;
  align-items: center;
  justify-content: center;

  .transfer-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 86vw;
    height: 5vh;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 22px;
    text-align: center;
    border-style: none;
    border-radius: 8px;
    background-color: var(--button-color-primary-default);
    color: var(--text-color-primary);
  }
}
</style>
