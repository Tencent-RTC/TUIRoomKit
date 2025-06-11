<template>
  <div
    v-if="userInfoConfig.visible"
    ref="userInfoRef"
    class="user-info-container"
  >
    <div class="user-info-content" @click="handleUserControl">
      <Avatar class="avatar" :img-src="avatarUrl" />
      <div class="name">{{ props.userName || props.userId }}</div>
      <IconArrowStrokeSelectDown
        size="12"
        :class="[showUserControl ? 'up-icon' : 'down-icon']"
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
        <TUIButton
          @click="closeUserNameEditor"
          type="primary"
          style="min-width: 88px"
        >
          {{ t('Cancel') }}
        </TUIButton>
        <TUIButton @click="saveUserName(tempUserName)" style="min-width: 88px">
          {{ t('Save') }}
        </TUIButton>
      </template>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { defineProps, defineEmits } from 'vue';
import Dialog from '../../common/base/Dialog';
import {
  TUIButton,
  IconArrowStrokeSelectDown,
  TUIToast,
  TOAST_TYPE,
} from '@tencentcloud/uikit-base-component-vue3';
import TuiInput from '../../common/base/Input';
import useUserInfo from './useUserInfoHooks';
import Avatar from '../../common/Avatar.vue';
import { roomService } from '../../../services';
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
    TUIToast({
      type: TOAST_TYPE.WARNING,
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
      color: var(--text-color-primary);
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
    background: var(--bg-color-dialog);
    filter: drop-shadow(0 0 4px var(--uikit-color-black-8))
      drop-shadow(0 4px 10px var(--uikit-color-black-8))
      drop-shadow(0 1px 14px var(--uikit-color-black-8));
    border-radius: 8px;

    &::before {
      position: absolute;
      top: -20px;
      right: 20px;
      width: 0;
      content: '';
      border-top: 10px solid transparent;
      border-right: 10px solid transparent;
      border-bottom: 10px solid var(--bg-color-dialog);
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
      color: var(--text-color-secondary);
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
</style>
