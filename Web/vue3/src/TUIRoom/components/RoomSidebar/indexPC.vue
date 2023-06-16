<template>
  <div
    class="sidebar-container"
  >
    <Drawer
      :model-value="isSidebarOpen"
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
    </Drawer>
  </div>
</template>

<script setup lang="ts">

import Chat from '../Chat/index.vue';
import RoomInvite from '../RoomInvite';
import RoomMore from '../RoomMore';
import ManageMember from '../ManageMember/index';
import Drawer from '../../elementComp/Drawer.vue';
import useSideBar from './useSideBarHooks';

const {
  isSidebarOpen,
  title,
  handleClose,
  sidebarName,
} = useSideBar();

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
    border-bottom: 1px solid var(--el-drawer-divide);
    box-sizing: border-box;
    margin-bottom: 0;
    font-size: 20px;
    color: var(--el-drawer-header-color);
    font-weight: 500;
    padding: 32px 22px 32px 32px;
  }
  .sidebar-container .el-drawer__body {
    padding: 0;
  }
</style>
