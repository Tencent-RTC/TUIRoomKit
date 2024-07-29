<template>
  <div id="pre-conference-container" :class="['pre-conference-container', tuiRoomThemeClass]">
    <div class="header">
      <div class="left-header">
        <switch-theme class="header-item"></switch-theme>
      </div>
      <div class="right-header">
        <language-icon class="header-item language"></language-icon>
        <user-info
          class="header-item user-info"
          :user-id="props.userInfo.userId"
          :user-name="props.userInfo.userName"
          :avatar-url="props.userInfo.avatarUrl"
          :is-show-edit-name="props.showEditNameInPc"
          @update-user-name="handleUpdateUserName"
          @log-out="handleLogOut"
        ></user-info>
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
    ></room-home-control>
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
        ></room-home-control>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import UserInfo from './components/RoomHeader/UserInfo/index.vue';
import RoomHomeControl from './components/RoomHome/RoomControl/index.vue';
import LanguageIcon from './components/common/Language.vue';
import SwitchTheme from './components/common/SwitchTheme.vue';
import { EventType, roomService } from './services/index';
import Logo from './components/common/Logo.vue';
import TUIMessageBox from './components/common/base/MessageBox/index';
import TUIMessage from './components/common/base/Message/index';
import { MESSAGE_DURATION } from './constants/message';
import { isMobile } from './utils/environment';

const roomControlRef = ref();

const props = withDefaults(defineProps<{
  userInfo: {
    userId: string,
    userName: string,
    avatarUrl: string,
  },
  showEditNameInPc: boolean,
  roomId: string,
  enableScheduledConference: boolean,
  isShowLogo?: boolean
}>(), {
  userInfo: () => ({
    userId: '',
    userName: '',
    avatarUrl: '',
  }),
  showEditNameInPc: false,
  roomId: '',
  enableScheduledConference: true,
  isShowLogo: true,
});

const emits = defineEmits(['on-create-room', 'on-enter-room', 'on-update-user-name', 'on-logout']);

const tuiRoomThemeClass = computed(() => `tui-theme-${roomService.basicStore.defaultTheme}`);

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
  cancelButtonText: string,
  confirmButtonText: string;
  callback?: () => void;
}) => {
  const {
    message,
    title = roomService.t('Note'),
    cancelButtonText,
    confirmButtonText = roomService.t('Sure'),
    callback = () => {},
  } = data;
  TUIMessageBox({
    title,
    message,
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

.tui-theme-black .pre-conference-container {
  --background: var(--background-color-1);
}
.tui-theme-white .pre-conference-container {
  --background: var(--background-color-1);
}

.tui-theme-black.pre-conference-container {
  --background: var(--background-color-1);
}

.pre-conference-container {
  width: 100%;
  height: 100%;
  background: var(--background);
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: PingFang SC;
  color: var(--font-color-1);
  .header {
    box-sizing: border-box;
    width: 100%;
    position: absolute;
    top: 0;
    padding: 22px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .left-header, .right-header {
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
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    flex-direction: column;
    .logo {
      margin-bottom: 56px;
    }
    .pre-home-control-container {
      display: flex;
    }
  }
}

</style>
