<template>
  <div class="sidebar-container-mobile">
    <popup
      v-show="isSidebarOpen"
      :title="title"
    >
      <template #sidebarContent>
        <div class="siderbar-content" style="height:100%">
          <chat v-if="sidebarName == 'chat'"></chat>
          <manage-member
            v-if="sidebarName == 'manage-member'"
          ></manage-member>
          <transfer-leave v-if="sidebarName == 'transfer-leave'" @on-exit-room="onExitRoom"></transfer-leave>
        </div>
      </template>
      <template #sidebarFooter>
        <div>
          <chat-editor v-if="sidebarName == 'chat'"></chat-editor>
        </div>
      </template>
    </popup>
  </div>
</template>

<script setup lang="ts">

import Chat from '../Chat/indexWX.vue';
import ManageMember from '../ManageMember/indexWX.vue';
import popup from '../common/PopUpH5.vue';
import TransferLeave from '../RoomFooter/EndControl/TransferLeaveWX.vue';
import useSideBar from './useSideBarHooks';
import ChatEditor from '../Chat/ChatEditor/ChatEditorWX.vue';
import { useBasicStore } from '../../stores/basic';
import { useRoomStore } from '../../stores/room';
import { useChatStore } from '../../stores/chat';

const emit = defineEmits(['on-exit-room']);
const basicStore = useBasicStore();
const roomStore = useRoomStore();
const chatStore = useChatStore();

const onExitRoom = (info: { code: number; message: string }) => {
  basicStore.reset();
  chatStore.reset();
  roomStore.reset();
  emit('on-exit-room', info);
};

const {
  isSidebarOpen,
  title,
  sidebarName,
} = useSideBar();

</script>
<style lang="scss" scoped>
.sidebar-container-mobile {
    height: 100%;
    position: fixed;
    top: 0;
    right: 0;
    z-index: 101
}
</style>
