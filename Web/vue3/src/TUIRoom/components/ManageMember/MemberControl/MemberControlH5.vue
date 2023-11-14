<template>
  <div v-if="!isMe" class="member-control-container">
    <div class="member-title">
      <img class="avatar-url" :src="userInfo.avatarUrl || defaultAvatar" />
      <div class="member-title-content">{{ userInfo.userName || userInfo.userId }}</div>
      <!-- TODO: 完善 v-tap 的 .stop 修饰符 -->
      <span v-if="isWeChat" v-tap.stop="handleCloseControl" class="cancel">{{ t('Cancel') }}</span>
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
  </div>
</template>

<script setup lang="ts">
import defaultAvatar from '../../../assets/imgs/avatar.png';
import SvgIcon from '../../common/base/SvgIcon.vue';
import { isWeChat } from '../../../utils/useMediaValue';
import vTap from '../../../directives/vTap';
import useMemberControlHooks from './useMemberControlHooks';
import { useI18n } from '../../../locales';
import { UserInfo } from '../../../stores/room';

interface Props {
  userInfo: UserInfo,
}

const props = defineProps<Props>();

const { t } = useI18n();
const { isMe, controlList } = useMemberControlHooks(props);

const emit = defineEmits(['on-close-control']);

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
    margin-top: 10px;
    align-items: center;
    .control-title {
      margin-left: 10px;
    }
  }
}
.cancel{
  flex: 1;
  text-align: end;
  padding-right: 30px
}
</style>

