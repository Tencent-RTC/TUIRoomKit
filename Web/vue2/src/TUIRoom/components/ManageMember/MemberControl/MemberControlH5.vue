<template>
  <div v-if="!isMe" class="member-control-container">
    <div class="member-title">
      <Avatar class="avatar-url" :img-src="userInfo.avatarUrl"></Avatar>
      <div class="member-title-content">{{ userInfo.userName || userInfo.userId }}</div>
      <!-- TODO: 完善 v-tap 的 .stop 修饰符 -->
      <span v-if="isWeChat" v-tap.stop="handleCloseControl" class="tab-cancel">{{ t('Cancel') }}</span>
    </div>
    <div
      v-for="item, index in controlList"
      :key="index"
      v-tap="() => item.func(userInfo)"
      class="user-operate-item"
    >
      <svg-icon :icon="item.icon" class="icon-svg"></svg-icon>
      <div class="control-title">{{ item.title }}</div>
    </div>
    <Dialog
      v-model="showKickOffDialog"
      :title="t('Note')"
      :modal="true"
      width="480px"
      :before-close="handleCancelKickOffDialog"
      :close-on-click-modal="true"
      :append-to-room-container="true"
    >
      <span>{{ kickOffDialogContent }}</span>
      <template #cancel>
        <tui-button size="default" class="cancel-button" type="text" @click="handleCancelKickOffDialog">{{ t('Cancel') }}</tui-button>
      </template>
      <template #agree>
        <tui-button size="default" class="agree-button" type="text" :custom-style="customStyle" @click="kickOffUser(props.userInfo)">{{ t('Confirm') }}</tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Avatar from '../../common/Avatar.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import { isWeChat } from '../../../utils/useMediaValue';
import Dialog from '../../common/base/Dialog';
import TuiButton from '../../common/base/Button.vue';
import '../../../directives/vTap';
import useMemberControlHooks from './useMemberControlHooks';
import { useI18n } from '../../../locales';
import { UserInfo } from '../../../stores/room';

interface Props {
  userInfo: UserInfo,
}

const props = defineProps<Props>();

const { t } = useI18n();
const {
  isMe,
  controlList,
  showKickOffDialog,
  kickOffDialogContent,
  kickOffUser,
  handleCancelKickOffDialog,
} = useMemberControlHooks(props);

const emit = defineEmits(['on-close-control']);
const customStyle = { color: '#1C66E5' };

function handleCloseControl() {
  emit('on-close-control');
}
</script>

<style lang="scss" scoped>
.member-control-container {
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 2;
  padding: 22px 16px;
  background: var(--member-control-background-color-h5);
  border-radius: 15px 15px 0px 0px;
  display: flex;
  flex-direction: column !important;
  animation-duration: 200ms;
  animation-name: popup;
  @keyframes popup {
  from {
    transform-origin: bottom;
    transform: scaleY(0);
  }
  to {
    transform-origin: bottom;
    transform: scaleY(1);
  }
}
  .member-title{
    display: flex;
    flex-direction: row;
    width: 100%;
    margin-bottom: 10px;
    align-items: center;
    .avatar-url{
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
    .member-title-content{
      font-weight: 500;
      font-size: 16px;
      line-height: 22px;
      color: var(--member-title-content-h5);
      margin-left: 10px;
    }
  }
  .user-operate-item {
    width: 100%;
    display: flex;
    padding-top: 10px;
    align-items: center;
    .control-title {
      margin-left: 10px;
    }
  }
}
.agree-button, .cancel-button{
  padding: 12px;
  width: 50%;
  display: flex;
  align-items: center;
}
.agree-button {
  color: var(--active-color-1);
}
.tab-cancel{
  flex: 1;
  text-align: end;
  padding-right: 30px
}
</style>
