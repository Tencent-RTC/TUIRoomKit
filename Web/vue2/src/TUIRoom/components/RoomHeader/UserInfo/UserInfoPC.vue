<template>
  <div ref="userInfoRef" class="user-info-container">
    <div class="user-info-content" @click="handleUserControl">
      <img class="avatar" :src="avatarUrl || defaultAvatar">
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
      width="420px"
      :model-value="showUserNameEdit"
      class="custom-element-class"
      :modal="true"
      :append-to-body="false"
      :close-on-click-modal="true"
      @close="closeEditUserNameDialog"
    >
      <div class="dialog-content">
        <span class="title">{{ t('User Name') }}</span>
        <div class="input-container">
          <el-input
            v-model="tempUserName"
            type="text"
            maxlength="80"
            :placeholder="t('Please input user name')"
          ></el-input>
        </div>
      </div>
      <div class="dialog-footer">
        <el-button @click="closeEditUserNameDialog">{{ t('Cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveUserName(tempUserName)">{{ t('Save') }}</el-button>
      </div>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import { Dialog } from '../../../elementComp/Dialog';
import SvgIcon from '../../common/SvgIcon.vue';
import defaultAvatar from '../../../assets/imgs/avatar.png';
import useUserInfo from './useUserInfoHooks';
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
<style lang="scss">
@import '../../../assets/style/var.scss';
@import '../../../assets/style/element-custom.scss';


.dialog-content {
  padding: 0 10px;
  text-align: left;
  .title {
    font-weight: bold;
    font-size: 16px;
    display: inline-block;
    margin-bottom: 14px;
  }
  .input-container {
    position: relative;
    margin-bottom: 30px;
  }
}
.dialog-footer {
  width: 100%;
  height: 100%;
  text-align: center;
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
      margin-left: 20px;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--color-font);
    }
    .down-icon {
      margin-left: 4px;
    }
  }
  .user-control-container {
    background: var(--user-control-container-color-bg);
    box-shadow: var(--user-control-container-shadow);
    color: var(--color-font);
    padding: 10px 0;
    position: absolute;
    top: calc(100% + 14px);
    right: 0;
    border-radius: 4px;
    .user-control-item-foot,.user-control-item-head{
      width: 104px;
      text-align: center;
      font-size: 14px;
      cursor: pointer;
      height: 20px;
    }
  }
}
</style>
