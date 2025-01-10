<template>
  <div class="popup-container" @touchmove.stop.prevent="() => {}">
    <header class="popup-main-header">
      <div class="icon-container" @tap="handleClose">
				<div class="close-icon">
					<svg-icon style="display: flex" icon="ArrowStrokeBackIcon"></svg-icon>
				</div>
      </div>
      <text class="sidebar-title">{{ title }}</text>
    </header>
    <main class="popup-main-content">
      <slot name="sidebarContent" />
    </main>
    <footer class="popup-main-footer">
      <slot name="sidebarFooter" />
    </footer>
  </div>
</template>
<script setup lang="ts">
import SvgIcon from './SvgIcon.vue';
import { useBasicStore } from '../../../stores/basic';

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
  width: 750rpx;
  height: 1640rpx;
  background: white;
  position: fixed;
  top: 40px;
  right: 0;
	bottom: 0;
	left: 0;
  flex: 1;
  .popup-main-header {
    width: 750rpx;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
		position: relative;
    .icon-container{
      position: absolute;
      left: 0;
      top: 0;
      width: 68px;
      height: 58px;
			display: flex;
			justify-content: center;
			align-items: center;
    }
    .sidebar-title {
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 16px;
      line-height: 22px;
      text-align: center;
      color: #000000;
    }
    .close-icon{
      width: 10px;
      height: 18px;
      }
  }
  .popup-main-content {
    width: 750rpx;
    overflow: hidden;
  }
  .popup-main-footer {
    width: 750rpx;
    position: sticky;
    bottom: 0;
    padding-top: 10px;
  }
}
</style>
