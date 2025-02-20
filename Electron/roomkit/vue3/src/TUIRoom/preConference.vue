<template>
  <div
    id="pre-conference-container"
    :class="['pre-conference-container', tuiRoomThemeClass]"
  >
    <div class="header" v-show="props.isShowHeaderInfo">
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
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  withDefaults,
  defineProps,
  defineEmits,
  computed,
} from 'vue';
import UserInfo from './components/RoomHeader/UserInfo/index.vue';
import RoomHomeControl from './components/RoomHome/RoomControl/index.vue';
import LanguageIcon from './components/common/Language.vue';
import SwitchTheme from './components/common/SwitchTheme.vue';
import { EventType, roomService } from './services/index';
import ScheduleRoomList from './components/ScheduleConference/ScheduleRoomList.vue';
import Logo from './components/common/Logo.vue';
import TUIMessageBox from './components/common/base/MessageBox/index';
import TUIMessage from './components/common/base/Message/index';
import { MESSAGE_DURATION } from './constants/message';
import { isMobile } from './utils/environment';

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
    isShowHeaderInfo?: boolean;
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
    isShowHeaderInfo: true,
  }
);

const emits = defineEmits([
  'on-create-room',
  'on-enter-room',
  'on-update-user-name',
  'on-logout',
]);

const hasThemeMode = document.documentElement.hasAttribute('tui-theme-mode');

const tuiRoomThemeClass = computed(() =>
  hasThemeMode ? '' : `tui-theme-${roomService.basicStore.defaultTheme}`
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

<style lang="scss">
@import './assets/style/global.scss';
@import '@tencentcloud/uikit-base-component-vue3/dist/styles/index.css';

:root[tui-theme-mode='light'] {
  --preconference-background: url('./assets/imgs/background-white.png');
}

:root[tui-theme-mode='dark'] {
  --preconference-background: var(--bg-color-topbar);
}
.pre-conference-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-family: 'PingFang SC';
  background-size: cover;
  background: var(--preconference-background);
  color: var(--text-color-primary);

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

.tui-theme-light.pre-conference-container {
  background: url('./assets/imgs/background-white.png');
}

.tui-theme-dark.pre-conference-container {
  background-color: var(--bg-color-topbar);
}
</style>
