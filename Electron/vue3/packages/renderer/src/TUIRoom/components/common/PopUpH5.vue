<template>
  <div class="popup-container">
    <div class="popup-main-header">
      <svg-icon v-tap="handleClose" class="close-icon" size="custom" icon-name="close-back"></svg-icon>
      <span class="sidebar-title">{{ title }}</span>
    </div>
    <div class="popup-main-content">
      <slot name="sidebarContent" />
    </div>
    <div class="popup-main-footer">
      <slot name="sidebarFooter" />
    </div>
  </div>
</template>
<script setup lang="ts">
import SvgIcon from './SvgIcon.vue';
import { useBasicStore } from '../../stores/basic';
import vTap from '../../directives/vTap';

interface Props {
  title: string,
}
defineProps<Props>();

const basicStore = useBasicStore();

function handleClose() {
  basicStore.setSidebarOpenStatus(false);
  basicStore.setSidebarName('');
}

</script>
<style lang="scss" scoped>
.popup-container {
  width: 100vw;
  height: 100%;
  background: var(--room-detail-background);
  position: static;
  flex: 1;
  .popup-main-header {
    position: sticky;
    top: 0;
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    .sidebar-title {
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 16px;
      line-height: 22px;
      text-align: center;
      color: var(--input-font-color);
    }
    .close-icon{
      position: absolute;
      top: 21px;
      left: 22px;
      width: 10px;
      height: 18px;
      background-size: cover;
      }
  }
  .popup-main-content {
    width: 100%;
    height: calc(100% - 130px);
    overflow: hidden;
  }
  .popup-main-footer {
    width: 100%;
    height: auto;
    position: sticky;
    bottom: 0;
    padding-top: 10px;
  }
}
</style>
