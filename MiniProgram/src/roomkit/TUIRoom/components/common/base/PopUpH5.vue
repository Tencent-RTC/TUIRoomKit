<template>
  <div class="popup-container">
    <div class="popup-main-header">
      <span @tap="handleClose" class="icon-container">
        <svg-icon style="display: flex" class="close-icon" :icon="ArrowStrokeBackIcon" />
      </span>
      <span class="sidebar-title">{{ title }}</span>
    </div>
    <div class="popup-main-content">
      <slot name="sidebarContent"></slot>
    </div>
    <div class="popup-main-footer">
      <slot name="sidebarFooter"></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
import { defineProps } from 'vue';
import SvgIcon from './SvgIcon.vue';
import { useBasicStore } from '../../../stores/basic';
import ArrowStrokeBackIcon from '../../../assets/icons/ArrowStrokeBackIcon.svg';

interface Props {
  title: string;
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
  position: static;
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100vw;
  height: 100%;
  background-color: var(--bg-color-topbar);

  .popup-main-header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 60px;

    .icon-container {
      position: absolute;
      top: 0;
      left: 0;
      box-sizing: content-box;
      width: 10px;
      height: 18px;
      padding: 20px 25px;
      background-size: cover;
    }

    .sidebar-title {
      font-family: 'PingFang SC';
      font-size: 16px;
      font-style: normal;
      font-weight: 500;
      line-height: 22px;
      text-align: center;
      color: var(--text-color-primary);
    }

    .close-icon {
      width: 10px;
      height: 18px;
      background-size: cover;
    }
  }

  .popup-main-content {
    flex: 1;
    width: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .popup-main-footer {
    flex-shrink: 0;
    width: 100%;
    height: auto;
  }
}
</style>
