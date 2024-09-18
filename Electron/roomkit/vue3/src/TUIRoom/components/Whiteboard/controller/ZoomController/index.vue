<template>
  <div class="scale-controller-box">
    <div class="scale-controller-btn" @click="resetScale">
      <img :src="reset" />
    </div>
    <div class="scale-controller-cut-line"></div>
    <div class="scale-controller-btn" @click="zoomOut">
      <img :src="less" />
    </div>
    <div>{{ zoomRatio }} <span style="opacity: 0.6">%</span></div>
    <div class="scale-controller-btn" @click="zoomIn">
      <img :src="plus" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, Ref } from 'vue';
import FabricCanvas from './../../core';
import reset from './image/reset.svg';
import plus from './image/plus.svg';
import less from './image/less.svg';

const canvas = inject<Ref<FabricCanvas>>('canvas');
const zoomRatio = ref<number>(100);

function resetScale() {
  canvas?.value.zoom(1);
  zoomRatio.value = 100;
}
function zoomIn() {
  canvas?.value.zoomIn();
  zoomRatio.value = Math.floor((canvas?.value.getZoom() as number) * 100);
}
function zoomOut() {
  canvas?.value.zoomOut();
  zoomRatio.value = Math.floor((canvas?.value.getZoom() as number) * 100);
}
</script>
<style lang="scss" scoped>
.scale-controller-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  font-size: 12px;
  user-select: none;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.08);
}

.scale-controller-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 4px;
  margin-left: 4px;
  cursor: pointer;
  border-radius: 2px;

  &:hover {
    background: rgba(33, 35, 36, 0.1);
  }
}

.scale-controller-cut-line {
  width: 0.5px;
  height: 20px;
  background-color: #e7e7e7;
}
</style>
