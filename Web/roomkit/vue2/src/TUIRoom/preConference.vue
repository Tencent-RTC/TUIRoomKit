<template>
  <div
    id="pre-conference-container"
    :class="['pre-conference-container', tuiRoomThemeClass]"
  >
    <div class="header">
      <div class="left-header">
        <switch-theme class="header-item" />
      </div>
      <div class="right-header">
        <language-icon class="header-item language" />
        <user-info
          class="header-item user-info"
          :user-id="props.userInfo.userId"
          :user-name="props.userInfo.userName"
          :avatar-url="props.userInfo.avatarUrl"
          :is-show-edit-name="props.showEditNameInPc"
          @update-user-name="handleUpdateUserName"
          @log-out="handleLogOut"
        />
      </div>
    </div>
    <room-home-control
      v-if="isMobile"
      ref="roomControlRef"
      :given-room-id="props.roomId"
      :user-name="props.userInfo.userName"
      @create-room="handleCreateRoom"
      @enter-room="handleEnterRoom"
      @update-user-name="handleUpdateUserName"
    />
    <div class="pre-home-control" v-else>
      <Logo v-show="props.isShowLogo" class="logo" />
      <div class="pre-home-control-container">
        <room-home-control
          ref="roomControlRef"
          :given-room-id="props.roomId"
          :user-name="props.userInfo.userName"
          :enable-scheduled-conference="props.enableScheduledConference"
          @create-room="handleCreateRoom"
          @enter-room="handleEnterRoom"
          @update-user-name="handleUpdateUserName"
        />
        <schedule-room-list
          :is-show-scheduled-conference="props.enableScheduledConference"
          @join-conference="handleEnterRoom"
        />
      </div>
    </div>
    <InvitationNotification @join-conference="handleEnterRoom" />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  withDefaults,
  defineProps,
  defineEmits,
} from 'vue';
import UserInfo from './components/RoomHeader/UserInfo';
import RoomHomeControl from './components/RoomHome/RoomControl';
import LanguageIcon from './components/common/Language.vue';
import SwitchTheme from './components/common/SwitchTheme.vue';
import { EventType, roomService } from './services/index';
import ScheduleRoomList from './components/ScheduleConference/ScheduleRoomList.vue';
import Logo from './components/common/Logo.vue';
import TUIMessageBox from './components/common/base/MessageBox/index';
import TUIMessage from './components/common/base/Message/index';
import { MESSAGE_DURATION } from './constants/message';
import { isMobile } from './utils/environment';
import InvitationNotification from './components/RoomInvite/InvitationNotification.vue';

const roomControlRef = ref();
const props = withDefaults(
  defineProps<{
    userInfo: {
      userId: string;
      userName: string;
      avatarUrl: string;
    };
    showEditNameInPc: boolean;
    roomId: string;
    enableScheduledConference: boolean;
    isShowLogo?: boolean;
  }>(),
  {
    userInfo: () => ({
      userId: '',
      userName: '',
      avatarUrl: '',
    }),
    showEditNameInPc: false,
    roomId: '',
    enableScheduledConference: true,
    isShowLogo: true,
  }
);

const emits = defineEmits([
  'on-create-room',
  'on-enter-room',
  'on-update-user-name',
  'on-logout',
]);

const tuiRoomThemeClass = computed(
  () => `tui-theme-${roomService.basicStore.defaultTheme}`
);

async function handleCreateRoom(roomOption: Record<string, any>) {
  emits('on-create-room', roomOption);
}

async function handleEnterRoom(roomOption: Record<string, any>) {
  emits('on-enter-room', roomOption);
}

function handleUpdateUserName(userName: string) {
  emits('on-update-user-name', userName);
}

async function handleLogOut() {
  emits('on-logout');
}

const showMessageBox = (data: {
  code?: number;
  message: string;
  title: string;
  duration?: number;
  cancelButtonText: string;
  confirmButtonText: string;
  callback?: () => void;
}) => {
  const {
    message,
    title = roomService.t('Note'),
    duration,
    cancelButtonText,
    confirmButtonText = roomService.t('Sure'),
    callback = () => {},
  } = data;
  TUIMessageBox({
    title,
    message,
    duration,
    cancelButtonText,
    confirmButtonText,
    callback,
  });
};
const showMessage = (data: {
  type: 'warning' | 'success' | 'error' | 'info';
  message: string;
  duration: MESSAGE_DURATION;
}) => {
  const { type, message, duration } = data;
  TUIMessage({
    type,
    message,
    duration,
  });
};

onMounted(() => {
  roomService.on(EventType.ROOM_NOTICE_MESSAGE, showMessage);
  roomService.on(EventType.ROOM_NOTICE_MESSAGE_BOX, showMessageBox);
});
onUnmounted(() => {
  roomService.off(EventType.ROOM_NOTICE_MESSAGE, showMessage);
  roomService.off(EventType.ROOM_NOTICE_MESSAGE_BOX, showMessageBox);
});
</script>

<style>
@import './assets/style/global.scss';
@import './assets/style/black-theme.scss';
@import './assets/style/white-theme.scss';
</style>

<style lang="scss" scoped>
.pre-conference-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-family: 'PingFang SC';
  color: var(--font-color-1);
  background: var(--background);
  background-size: cover;

  .header {
    position: absolute;
    top: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 4rem;
    padding: 0 24px;

    .left-header,
    .right-header {
      display: flex;
      align-items: center;

      .header-item {
        &:not(:first-child) {
          margin-left: 16px;
        }
      }
    }
  }

  .pre-home-control {
    position: absolute;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateX(-50%);

    .logo {
      margin-bottom: 56px;
    }

    .pre-home-control-container {
      display: flex;
    }
  }
}

.tui-theme-black.pre-conference-container {
  background: var(--background-color-1);
}

.tui-theme-white.pre-conference-container {
  background: url('./assets/imgs/background-white.png');
}
</style>
