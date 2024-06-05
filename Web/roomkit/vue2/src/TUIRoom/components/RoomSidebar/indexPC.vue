<template>
  <div
    class="sidebar-container"
  >
    <Drawer
      v-model="isSidebarOpen"
      :modal="false"
      :title="title"
      :before-close="handleClose"
      :size="400"
    >
      <chat v-if="sidebarName == 'chat'"></chat>
      <room-invite v-if="sidebarName == 'invite'"></room-invite>
      <room-more v-if="sidebarName == 'more'"></room-more>
      <manage-member v-if="sidebarName == 'manage-member'"></manage-member>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import Chat from '../Chat/index.vue';
import Drawer from '../common/base/Drawer.vue';
import useSideBar from './useSideBarHooks';
import RoomInvite from '../RoomInvite';
import ManageMember from '../ManageMember';
import RoomMore from '../RoomMore';
const {
  isSidebarOpen,
  title,
  handleClose,
  sidebarName,
} = useSideBar();

</script>

<style lang="scss">
</style>
