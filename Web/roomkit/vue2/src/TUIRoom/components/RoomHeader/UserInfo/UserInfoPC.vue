<template>
  <div
    v-if="userInfoConfig.visible"
    ref="userInfoRef"
    class="user-info-container"
  >
    <div class="user-info-content" @click="handleUserControl">
      <Avatar class="avatar" :img-src="avatarUrl" />
      <div class="name">{{ props.userName || props.userId }}</div>
      <svg-icon
        :class="[showUserControl ? 'up-icon' : 'down-icon']"
        :icon="ArrowStrokeSelectDownIcon"
      />
    </div>
    <div v-if="showUserControl" class="user-control-container">
      <div v-show="props.isShowEditName">
        <div class="user-control-item-head" @click="showEditUserNameDialog">
          {{ t('Edit profile') }}
        </div>
      </div>
      <div class="user-control-item-foot" @click="$emit('log-out')">
        {{ t('Log out') }}
      </div>
    </div>
    <Dialog
      v-model="isUserNameEditorVisible"
      :title="t('Edit profile')"
      :modal="true"
      width="480px"
      :close-on-click-modal="true"
      :append-to-body="true"
    >
      <div class="edit-content">
        <span>{{ t('User Name') }}</span>
        <tui-input
          :model-value="tempUserName"
          @input="tempUserName = $event"
          class="edit-name-input"
          maxlength="16"
          :placeholder="t('Please input user name')"
        />
      </div>
      <template #footer>
        <tui-button class="button" size="default" @click="closeUserNameEditor">
          {{ t('Cancel') }}
        </tui-button>
        <tui-button
          class="button"
          size="default"
          type="primary"
          @click="saveUserName(tempUserName)"
        >
          {{ t('Save') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { defineProps, defineEmits } from 'vue';
import Dialog from '../../common/base/Dialog';
import SvgIcon from '../../common/base/SvgIcon.vue';
import TuiButton from '../../common/base/Button.vue';
import TuiInput from '../../common/base/Input';
import ArrowStrokeSelectDownIcon from '../../common/icons/ArrowStrokeSelectDownIcon.vue';
import useUserInfo from './useUserInfoHooks';
import Avatar from '../../common/Avatar.vue';
import { roomService } from '../../../services';
import TUIMessage from '../../common/base/Message/index';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';

const emits = defineEmits(['log-out', 'update-user-name']);

const userInfoConfig = roomService.getComponentConfig('UserInfo');

const basicStore = useBasicStore();
const roomStore = useRoomStore();

const {
  t,
  showUserControl,
  isUserNameEditorVisible,
  userInfoRef,
  tempUserName,
  handleUserControl,
  showEditUserNameDialog,
  closeUserNameEditor,
} = useUserInfo();

const props = defineProps<{
  userId: string;
  userName: string;
  avatarUrl?: string;
  isShowEditName?: boolean;
}>();

async function saveUserName(userName: string) {
  const { userId } = props;
  if (userName.length === 0) {
    TUIMessage({
      type: 'warning',
      message: t('Username length should be greater than 0'),
      duration: MESSAGE_DURATION.NORMAL,
    });
    return;
  }
  await TUIRoomEngine.setSelfInfo({
    userName,
    avatarUrl: roomStore.localUser.avatarUrl || '',
  });
  basicStore.setUserName(userName);
  roomStore.updateUserInfo({ userId, userName });
  emits('update-user-name', userName);
  closeUserNameEditor();
}
</script>
<style lang="scss" scoped>
.tui-theme-white .user-control-container {
  --filter-color: drop-shadow(0px 0px 4px rgba(32, 77, 141, 0.03))
    drop-shadow(0px 4px 10px rgba(32, 77, 141, 0.06))
    drop-shadow(0px 1px 14px rgba(32, 77, 141, 0.05));
}

.tui-theme-black .user-control-container {
  --filter-color: drop-shadow(0px 8px 40px rgba(23, 25, 31, 0.6))
    drop-shadow(0px 4px 12px rgba(23, 25, 31, 0.4));
}

.user-info-container {
  position: relative;

  .user-info-content {
    display: flex;
    align-items: center;
    cursor: pointer;

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
    }

    .name {
      max-width: 100px;
      margin-left: 10px;
      overflow: hidden;
      font-size: 16px;
      color: var(--font-color);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .down-icon {
      margin-left: 4px;
    }

    .up-icon {
      margin-left: 4px;
      transform: rotate(180deg);
    }
  }

  .user-control-container {
    position: absolute;
    top: calc(100% + 15px);
    right: 0;
    min-width: 100px;
    padding: 10px;
    background: #fff;
    filter: var(--filter-color);
    border-radius: 8px;

    &::before {
      position: absolute;
      top: -20px;
      right: 20px;
      width: 0;
      content: '';
      border-top: 10px solid transparent;
      border-right: 10px solid transparent;
      border-bottom: 10px solid #fff;
      border-left: 10px solid transparent;
    }

    &::after {
      position: absolute;
      top: -20px;
      left: 0;
      width: 100%;
      height: 20px;
      content: '';
      background-color: transparent;
    }

    .user-control-item-foot,
    .user-control-item-head {
      height: 20px;
      font-size: 14px;
      color: #4f586b;
      text-align: center;
      cursor: pointer;
    }
  }
}

.edit-content {
  display: flex;
  align-items: center;
  width: 100%;

  .edit-name-input {
    flex-grow: 1;
    width: auto;
    margin-left: 16px;
  }
}

.button {
  margin-left: 12px;
}
</style>
