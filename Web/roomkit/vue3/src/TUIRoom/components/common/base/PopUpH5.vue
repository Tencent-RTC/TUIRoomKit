<template>
  <div class="popup-container">
    <div class="popup-main-header">
      <span v-tap="handleClose" class="icon-container">
        <IconArrowStrokeBack size="10" class="close-icon" />
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
import { IconArrowStrokeBack } from '@tencentcloud/uikit-base-component-vue3';
import { useBasicStore } from '../../../stores/basic';
import vTap from '../../../directives/vTap';

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
  flex: 1;
  width: 100vw;
  height: 100%;
  background-color: var(--bg-color-topbar);

  .popup-main-header {
    display: flex;
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
      background-size: cover;
    }
  }

  .popup-main-content {
    width: 100%;
    height: calc(100% - 130px);
    overflow: hidden;
  }

  .popup-main-footer {
    position: sticky;
    bottom: 0;
    width: 100%;
    height: auto;
    padding-top: 10px;
  }
}
</style>
