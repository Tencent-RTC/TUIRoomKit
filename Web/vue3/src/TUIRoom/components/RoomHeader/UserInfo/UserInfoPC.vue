<template>
  <div ref="userInfoRef" class="user-info-container">
    <div class="user-info-content" @click="handleUserControl">
      <Avatar class="avatar" :img-src="avatarUrl"></Avatar>
      <div class="name">{{ userName || userId }}</div>
      <svg-icon class="down-icon" :icon-name="iconName" size="medium"></svg-icon>
    </div>
    <div v-if="showUserControl" class="user-control-container">
      <div v-show="showEditNameItem">
        <div class="user-control-item-head" @click="showEditUserNameDialog">{{ t('Edit profile') }}</div>
      </div>
      <div class="user-control-item-foot" @click="$emit('log-out')">{{ t('Log out') }}</div>
    </div>
    <Dialog
      :title="t('Edit profile')"
      :model-value="showUserNameEdit"
      :modal="true"
      width="480px"
      :close-on-click-modal="true"
      :append-to-room-container="true"
      @close="closeEditUserNameDialog"
    >
      <div class="edit-content">
        <span>{{ t('User Name') }}</span>
        <tui-input v-model="tempUserName" class="edit-name-input" :placeholder="t('Please input user name')" />
      </div>
      <template #footer>
        <Button class="button" size="default" @click="closeEditUserNameDialog">{{ t('Cancel') }}</Button>
        <Button class="button" size="default" type="primary" @click="handleSaveUserName(tempUserName)">
          {{ t('Save') }}
        </Button>
      </template>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import Dialog from '../../common/base/Dialog';
import SvgIcon from '../../common/base/SvgIcon.vue';
import useUserInfo from './useUserInfoHooks';
import Avatar from '../../common/Avatar.vue';
import Button from '../../common/base/Button.vue';
import TuiInput from '../../common/base/Input.vue';
const {
  t,
  showEditNameItem,
  iconName,
  showUserControl,
  showUserNameEdit,
  userInfoRef,
  tempUserName,
  handleUserControl,
  showEditUserNameDialog,
  closeEditUserNameDialog,
  handleSaveUserName } = useUserInfo();
    interface Props {
    userId: string,
    userName: string,
    avatarUrl?: string,
  }
defineProps<Props>();
defineEmits(['log-out']);
</script>
<style lang="scss" scoped>
@import '../../../assets/style/var.scss';
@import '../../../assets/style/element-custom.scss';

.tui-theme-white .user-control-container {
  --filter-color:
    drop-shadow(0px 0px 4px rgba(32, 77, 141, 0.03))
    drop-shadow(0px 4px 10px rgba(32, 77, 141, 0.06))
    drop-shadow(0px 1px 14px rgba(32, 77, 141, 0.05));
}
.tui-theme-black .user-control-container {
  --filter-color:
    drop-shadow(0px 8px 40px rgba(23, 25, 31, 0.6))
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
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--font-color);
    }
    .down-icon {
      margin-left: 4px;
    }
  }
  .user-control-container {
    position: absolute;
    top: calc(100% + 15px);
    right: 0;
    padding: 10px;
    min-width: 100px;
    background: #ffffff;
    border-radius: 8px;
    filter: var(--filter-color);
    &::before {
      content: '';
      position: absolute;
      right: 20px;
      top: -20px;
      width: 0px;
      border-top: 10px solid transparent;
      border-right: 10px solid transparent;
      border-bottom: 10px solid #ffffff;
      border-left: 10px solid transparent;
    }
    &::after {
      content: '';
      width: 100%;
      height: 20px;
      position: absolute;
      left: 0px;
      top: -20px;
      background-color: transparent;
    }

    .user-control-item-foot,
    .user-control-item-head {
      text-align: center;
      color: #4f586b;
      font-size: 14px;
      cursor: pointer;
      height: 20px;
    }
  }
}
.edit-content {
  width: 100%;
  display: flex;
  align-items: center;
  .edit-name-input {
    margin-left: 16px;
    flex-grow: 1;
  }
}
.button {
  margin-left: 12px;
}
</style>
