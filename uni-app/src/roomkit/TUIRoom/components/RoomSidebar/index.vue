<template>
  <popup v-if="showSideBar" :title="title" class="sidebar-container-mobile">
    <template #sidebarContent>
      <div style="height: 1440rpx">
        <manage-member v-if="sidebarName === 'manage-member'"></manage-member>
        <master-apply v-if="sidebarName === 'apply'"></master-apply>
      </div>
    </template>
  </popup>
</template>

<script setup lang="ts">
import useSideBar from './useSideBarHooks';
import { ref } from 'vue';
import MasterApply from '../RoomFooter/ApplyControl/MasterApplyControl/index';
import ManageMember from '../ManageMember/index';
import popup from '../common/base/PopUpH5.vue';

const screenHeight = ref();

screenHeight.value = uni.getSystemInfoSync().screenHeight;

const {
  title,
  sidebarName,
  showSideBar,
} = useSideBar();


</script>
<style lang="scss" scoped>
.sidebar-container-mobile {
  height: 1440rpx;
  position: fixed;
  top: 0;
  right: 0;
  z-index: 101;
}
</style>
