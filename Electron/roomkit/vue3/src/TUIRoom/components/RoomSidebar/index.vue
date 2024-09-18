<template>
  <div class="sidebar-container">
    <Drawer
      v-model="isSidebarOpen"
      :modal="false"
      :title="title"
      :before-close="handleClose"
      :size="400"
    >
      <chat v-if="sidebarName == 'chat'" />
      <room-more v-if="sidebarName == 'more'" />
      <manage-member v-if="sidebarName == 'manage-member'" />
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import Chat from '../Chat/index.vue';
import Drawer from '../common/base/Drawer.vue';
import useSideBar from './useSideBarHooks';
import ManageMember from '../ManageMember/index.vue';
import RoomMore from '../RoomMore/index.vue';
const { isSidebarOpen, title, handleClose, sidebarName } = useSideBar();
</script>

<style lang="scss"></style>
