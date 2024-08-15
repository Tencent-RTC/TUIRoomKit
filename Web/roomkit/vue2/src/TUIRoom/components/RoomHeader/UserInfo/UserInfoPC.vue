<template>
  <div v-if="userInfoConfig.visible" ref="userInfoRef" class="user-info-container">
    <div class="user-info-content" @click="handleUserControl">
      <Avatar class="avatar" :img-src="avatarUrl"></Avatar>
      <div class="name">{{ userName || userId }}</div>
      <svg-icon
        :class="[showUserControl ? 'up-icon' : 'down-icon']"
        :icon="ArrowStrokeSelectDownIcon"
      ></svg-icon>
    </div>
    <div v-if="showUserControl" class="user-control-container">
      <div class="user-control-item-foot" @click="$emit('log-out')">{{ t('Log out') }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import SvgIcon from '../../common/base/SvgIcon.vue';
import ArrowStrokeSelectDownIcon from '../../common/icons/ArrowStrokeSelectDownIcon.vue';
import useUserInfo from './useUserInfoHooks';
import Avatar from '../../common/Avatar.vue';
import { isInnerScene } from '../../../utils/constants';
import { roomService } from '../../../services';
import TUIMessage from '../../common/base/Message/index';
import { MESSAGE_DURATION } from '../../../constants/message';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';

const emits = defineEmits(['log-out', 'update-user-name']);

const userInfoConfig = roomService.getComponentConfig('UserInfo');

const basicStore = useBasicStore();
const roomStore = useRoomStore();

const {
  t,
  showUserControl,
  userInfoRef,
  handleUserControl,
  closeEditUserNameDialog,
} = useUserInfo();

const props = withDefaults(defineProps<{
  userId: string,
  userName: string,
  avatarUrl?: string,
}>(), {
});

// /**
//  * Save the new userName
//  *
// **/
// async function handleSaveUserName(userName: string) {
//   if (userName.length === 0) {
//     TUIMessage({
//       type: 'warning',
//       message: t('Username length should be greater than 0'),
//       duration: MESSAGE_DURATION.NORMAL,
//     });
//     return;
//   }
//   emits('update-user-name', userName);
//   basicStore.setUserName(userName);
//   TUIRoomEngine.setSelfInfo({ userName, avatarUrl: roomStore.localUser.avatarUrl || '' });
//   roomStore.setLocalUser({ userName });
//   closeEditUserNameDialog();
// }

</script>
<style lang="scss" scoped>
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
    .up-icon {
      margin-left: 4px;
      transform: rotate(180deg);
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
