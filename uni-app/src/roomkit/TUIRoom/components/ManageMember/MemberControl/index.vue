<template>
  <div v-if="!isGeneralUser" class="member-control-container">
    <div class="member-title">
      <div class="avatar-url">
        <Avatar :img-src="userInfo.avatarUrl"></Avatar>
      </div>
      <text class="member-title-content">{{ userInfo.userName || userInfo.userId }}</text>
      <!-- TODO: 完善 @tap 的 .stop 修饰符 -->
      <text v-if="isWeChat || isApp" class="tab-cancel" @tap.stop="handleCloseControl">{{ t('Cancel') }}</text>
    </div>
    <div
      v-for="item in controlList"
      :key="item.key"
      class="user-operate-item"
      @tap="() => item.func(userInfo)"
    >
      <svg-icon style="display: flex" :icon="item.icon" class="icon-svg"></svg-icon>
      <text class="control-title">{{ item.title }}</text>
    </div>
    <Dialog
      v-model="isDialogVisible"
      :title="dialogData.title"
      width="480px"
      :modal="true"
      :append-to-room-container="true"
      :confirm-button="dialogData.confirmText"
      :cancel-button="t('Cancel')"
      @confirm="handleAction(props.userInfo)"
      @cancel="handleCancelDialog"
    >
      <text>{{ dialogData.content }}</text>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Avatar from '../../common/Avatar.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import { isWeChat, isApp } from '../../../utils/environment';
import Dialog from '../../common/base/Dialog/index.vue';
import useMemberControlHooks from './useMemberControlHooks';
import { useI18n } from '../../../locales';
import { UserInfo } from '../../../stores/room';

interface Props {
  userInfo: UserInfo,
  showMemberControl: boolean,
}

const props = defineProps<Props>();

const { t } = useI18n();
const {
  isGeneralUser,
  controlList,
  handleCancelDialog,
  handleAction,
  isDialogVisible,
  dialogData,
} = useMemberControlHooks(props);

const emit = defineEmits(['on-close-control']);

function handleCloseControl() {
  emit('on-close-control');
}
</script>

<style lang="scss" scoped>
.member-control-container {
  width: 750rpx;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 2;
  padding: 22px 16px;
  background: #F2F2F2;
  border-radius: 15px 15px 0px 0px;
  display: flex;
  flex-direction: column !important;
}
  .member-title{
    display: flex;
    flex-direction: row;
    width: 750rpx;
    margin-bottom: 10px;
    align-items: center;
    position: relative;
    .avatar-url{
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
    .member-title-content{
      font-weight: 500;
      font-size: 16px;
      line-height: 22px;
      color: #5f5c5c;
      margin-left: 10px;
    }
  }
  .user-operate-item {
    width: 750rpx;
    display: flex;
    flex-direction: row;
    padding-top: 10px;
    align-items: center;
    .control-title {
      font-weight: 500;
      font-size: 16px;
      line-height: 22px;
      color: #5f5c5c;
      margin-left: 10px;
    }
  }
.agree-button, .cancel-button{
  padding: 12px;
  width: 50%;
  display: flex;
  align-items: center;
}
.agree-button {
  color: #1C66E5;
}
.tab-cancel{
  font-family: "PingFang SC";
  font-style: normal;
  line-height: 24px;
  font-weight: 400;
  font-size: 16px;
  color: #5f5c5c;
  position: absolute;
  right: 40px;
}
</style>
