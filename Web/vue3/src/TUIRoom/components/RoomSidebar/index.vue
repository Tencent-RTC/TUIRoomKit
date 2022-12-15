<template>
  <div
    class="sidebar-container"
  >
    <el-drawer
      v-model="isSidebarOpen"
      custom-class="custom-element-class"
      :modal="false"
      :title="title"
      direction="rtl"
      :before-close="handleClose"
      :size="480"
    >
      <chat v-if="sidebarName == 'chat'"></chat>
      <room-invite v-if="sidebarName == 'invite'"></room-invite>
      <room-more v-if="sidebarName == 'more'"></room-more>
      <manage-member v-if="sidebarName == 'manage-member'"></manage-member>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { useBasicStore } from '../../stores/basic';
import { computed, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import Chat from '../Chat/index.vue';
import RoomInvite from '../RoomInvite/index.vue';
import RoomMore from '../RoomMore/index.vue';
import ManageMember from '../ManageMember/index.vue';
import { useI18n } from 'vue-i18n';
import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { useChatStore } from '../../stores/chat';

const { t } = useI18n();
const roomEngine = useGetRoomEngine();

const chatStore = useChatStore();
const basicStore = useBasicStore();
const { isSidebarOpen, sidebarName } = storeToRefs(basicStore);

const title = computed((): string | undefined => {
  if (sidebarName.value === 'chat') {
    return t('Chat');
  }
  if (sidebarName.value === 'invite') {
    return t('Invite');
  }
  if (sidebarName.value === 'more') {
    return t('Contact us');
  }
  if (sidebarName.value === 'manage-member') {
    return t('Member management');
  }
  return '';
});

function handleClose(done: any) {
  basicStore.setSidebarOpenStatus(false);
  basicStore.setSidebarName('');
  done();
}

/** 监听消息接收，放在这里是为了保障消息进房后立即监听消息 */
const onReceiveTextMessage = (data: { roomId: string, message: any }) => {
  console.warn('onReceiveTextMessage:', data);
  const { message } = data;
  chatStore.updateMessageList({
    ID: message.messageId,
    type: 'TIMTextElem',
    payload: {
      text: message.message,
    },
    nick: message?.userName || message.userId,
    from: message.userId,
    flow: 'in',
    sequence: Math.random(),
  });
  if (!basicStore.isSidebarOpen || basicStore.sidebarName !== 'chat') {
    // eslint-disable-next-line no-plusplus
    chatStore.updateUnReadCount(++chatStore.unReadCount);
  }
};

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onReceiveTextMessage, onReceiveTextMessage);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onReceiveTextMessage, onReceiveTextMessage);
});
</script>

<style lang="scss">
@import '../../assets/style/element-custom.scss';

  .sidebar-container > div {
    inset: inherit !important;
    width: 480px !important;
    right: 0 !important;
    top: 0 !important;
    height: 100%;
    position: absolute !important;
  }
  .sidebar-container .el-drawer__header {
    height: 88px;
    border-bottom: 1px solid #2f313b;
    box-sizing: border-box;
    margin-bottom: 0;
    font-size: 20px;
    color: #CFD4E6;
    font-weight: 500;
    padding: 32px 22px 32px 32px;
  }
  .sidebar-container .el-drawer__body {
    padding: 0;
  }
</style>
