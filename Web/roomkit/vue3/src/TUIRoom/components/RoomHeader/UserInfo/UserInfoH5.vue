<template>
  <div
    v-if="userInfoConfig.visible"
    ref="userInfoRef"
    class="user-info-container"
  >
    <div v-tap="handleUserControl" class="user-info-content">
      <Avatar class="avatar" :img-src="avatarUrl" />
      <div class="name">{{ userName || userId }}</div>
    </div>

    <div v-if="showUserControl" class="user-control-container">
      <div class="logout-mobile">
        <div class="logout-mobile-main">
          <div v-tap="() => $emit('log-out')" class="logout">
            <i> {{ t('Log out') }}</i>
          </div>
          <div class="close" @click.stop="showUserControl = false">
            <i>{{ t('Cancel') }}</i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import Avatar from '../../common/Avatar.vue';
import useUserInfo from './useUserInfoHooks';
import vTap from '../../../directives/vTap';
import { roomService } from '../../../services';

const userInfoConfig = roomService.getComponentConfig('UserInfo');

const { userInfoRef, showUserControl, t, handleUserControl } = useUserInfo();
interface Props {
  userId: string;
  userName: string;
  avatarUrl?: string;
}
defineProps<Props>();
defineEmits(['log-out']);
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
      margin-left: 20px;
      overflow: hidden;
      font-size: 16px;
      color: var(--font-color);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .down-icon {
      margin-left: 4px;
    }
  }

  .user-control-container {
    position: absolute;
    top: calc(100% + 14px);
    right: 0;
    padding: 10px 0;
    color: var(--font-color);
    background: var(--user-control-container-color-bg);
    border-radius: 4px;
    box-shadow: var(--user-control-container-shadow);

    .user-control-item-foot,
    .user-control-item-head {
      width: 104px;
      height: 20px;
      font-size: 14px;
      text-align: center;
      cursor: pointer;
    }
  }

  .logout-mobile {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 9;
    box-sizing: border-box;
    width: 100vw;
    height: auto;
    background: var(--log-out-mobile);

    &-main {
      position: absolute;
      bottom: 34px;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }

    .logout {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 90%;
      padding: 1rem 0;
      background: var(--log-out);
      border-radius: 14px;

      i {
        font-family: 'PingFang SC';
        font-size: 20px;
        font-style: normal;
        font-weight: 400;
        line-height: 24px;
        color: #ff2e2e;
        text-align: center;
      }
    }

    .close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 90%;
      padding: 1em 0;
      margin-top: 0.625rem;
      background: var(--log-out-cancel);
      backdrop-filter: blur(27.1828px);
      border-radius: 14px;

      i {
        font-family: 'PingFang SC';
        font-size: 20px;
        font-style: normal;
        font-weight: 400;
        line-height: 24px;
        color: #007aff;
        text-align: center;
      }
    }
  }
}
</style>
