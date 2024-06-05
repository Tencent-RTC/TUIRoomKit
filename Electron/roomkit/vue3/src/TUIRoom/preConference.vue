<template>
  <div class="pre-conference-container">
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
      ref="roomControlRef"
      :given-room-id="props.roomId"
      :user-name="props.userInfo.userName"
      @create-room="handleCreateRoom"
      @enter-room="handleEnterRoom"
      @update-user-name="handleUpdateUserName"
    ></room-home-control>
  </div>
</template>

<script setup lang="ts">
import UserInfo from './components/RoomHeader/UserInfo/index.vue';
import RoomHomeControl from './components/RoomHome/RoomControl/index.vue';
import LanguageIcon from './components/common/Language.vue';
import SwitchTheme from './components/common/SwitchTheme.vue';
import { ref } from 'vue';
const roomControlRef = ref();

const props = withDefaults(defineProps<{
  userInfo: {
    userId: string,
    userName: string,
    avatarUrl: string,
  },
  showEditNameInPc: boolean,
  roomId: string,
}>(), {
  userInfo: () => ({
    userId: '',
    userName: '',
    avatarUrl: '',
  }),
  showEditNameInPc: false,
  roomId: '',
});

const emits = defineEmits(['on-create-room', 'on-enter-room', 'on-update-user-name', 'on-logout']);

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
  --background: url(./assets/imgs/background-white.png);
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
}

</style>
