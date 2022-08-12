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
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import Chat from '../Chat/index.vue';
import RoomInvite from '../RoomInvite/index.vue';
import RoomMore from '../RoomMore/index.vue';
import ManageMember from '../ManageMember/index.vue';

const basicStore = useBasicStore();
const { isSidebarOpen, sidebarName } = storeToRefs(basicStore);

const title = computed((): string | undefined => {
  if (sidebarName.value === 'chat') {
    return '聊天';
  }
  if (sidebarName.value === 'invite') {
    return '邀请成员';
  }
  if (sidebarName.value === 'more') {
    return '联系我们';
  }
  if (sidebarName.value === 'manage-member') {
    return '成员管理';
  }
  return '';
});

function handleClose(done: any) {
  basicStore.setSidebarOpenStatus(false);
  basicStore.setSidebarName('');
  done();
}
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
