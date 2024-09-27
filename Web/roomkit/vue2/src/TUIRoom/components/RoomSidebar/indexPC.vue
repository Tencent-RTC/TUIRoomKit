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
      <AITranscription v-if="sidebarName == 'aiTranscription'" />
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import Drawer from '../common/base/Drawer.vue';
import useSideBar from './useSideBarHooks';
import ManageMember from '../ManageMember';
import RoomMore from '../RoomMore';
import Chat from '../Chat/index';
import AITranscription from '../AITools/AITranscription.vue';
const { isSidebarOpen, title, handleClose, sidebarName } = useSideBar();
</script>

<style lang="scss"></style>
