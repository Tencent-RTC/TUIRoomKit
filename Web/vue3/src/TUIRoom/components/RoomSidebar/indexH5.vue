<template>
  <popup
    v-if="showSideBar"
    :title="title"
    class="sidebar-container-mobile"
  >
    <template #sidebarContent>
      <div style="height:100%">
        <chat v-if="sidebarName === 'chat'"></chat>
        <manage-member
          v-if="sidebarName === 'manage-member'"
        ></manage-member>
      </div>
    </template>
    <template #sidebarFooter>
      <div>
        <chat-editor v-if="sidebarName === 'chat'"></chat-editor>
      </div>
    </template>
  </popup>
</template>

<script setup lang="ts">

import Chat from '../Chat/index.vue';
import ManageMember from '../ManageMember/index';
import popup from '../common/base/PopUpH5.vue';
import useSideBar from './useSideBarHooks';
import ChatEditor from '../Chat/ChatEditor';

const {
  title,
  sidebarName,
  showSideBar,
} = useSideBar();

</script>
<style lang="scss" scoped>
.sidebar-container-mobile {
    height: 100%;
    position: fixed;
    top: 0;
    right: 0;
    z-index: 101;
}
</style>
