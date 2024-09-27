<template>
  <div>
    <div class="canvas-wrap" ref="canvasWrapRef">
      <div class="tool-box-out" v-show="isControllerVisiable">
        <ToolBox />
      </div>
      <div class="redo-undo-box" v-show="isControllerVisiable">
        <RedoUndo />
      </div>
      <div class="controller-box">
        <div class="save-controller" v-show="isSaveControllerVisiable">
          <SaveController />
        </div>
        <div class="close-controller" v-show="isControllerVisiable">
          <CloseController />
        </div>
      </div>
      <div class="image-controller" v-show="isImageControllerVisiable">
        <ImageController />
      </div>
      <!-- <div class="zoom-controller-box">
        <ZoomController />
      </div> -->
      <canvas class="whiteboard-canvas" id="canvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, Ref, ref, onUnmounted } from 'vue';
import { ipcRenderer } from 'electron';
import FabricCanvas from './core';
import ToolBox from './controller/ToolBox/index.vue';
import RedoUndo from './controller/RedoUndo/index.vue';
import CloseController from './controller/CloseController/index.vue';
import { getUrlParam } from '../../utils/utils';
import SaveController from './controller/SaveController/index.vue';
import ImageController from './controller/ImageController/index.vue';

const isAnnotationWin: Ref<boolean> = ref(false);
const isAnnotationStarted: Ref<boolean> = ref(false);
const canvas = ref<FabricCanvas>();
const canvasWrapRef = ref<HTMLDivElement>();

provide('canvas', canvas);

const isControllerVisiable = computed(
  () => !isAnnotationWin.value || isAnnotationStarted.value
);

const isSaveControllerVisiable = computed(() => !isAnnotationWin.value);
const isImageControllerVisiable = computed(() => !isAnnotationWin.value);
function init() {
  const fabricCanvas = new FabricCanvas('canvas');
  canvas.value = fabricCanvas;
}

function resizeCanvas() {
  canvas.value.setWidth(canvasWrapRef.value?.offsetWidth);
  canvas.value.setHeight(canvasWrapRef.value?.offsetHeight);
}

onMounted(() => {
  init();

  const annotationParam = getUrlParam('isAnnotationWin');
  if (annotationParam && annotationParam === 'true') {
    isAnnotationWin.value = true;
  }

  if (!isAnnotationWin.value) {
    canvas.value?.setBackgroundColor('white');
  }

  canvas.value.setWidth(canvasWrapRef.value?.offsetWidth);
  canvas.value.setHeight(canvasWrapRef.value?.offsetHeight);

  window.addEventListener('resize', resizeCanvas);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
});

ipcRenderer.on('annotation:annotating-started', () => {
  isAnnotationStarted.value = true;
});

ipcRenderer.on('annotation:annotating-stopped', () => {
  isAnnotationStarted.value = false;
});

ipcRenderer.on('whiteboard:clear', () => {
  if (canvas.value) {
    canvas.value.reloadCanvas();
  }
});

ipcRenderer.on('annotation:clear', () => {
  if (canvas.value) {
    canvas.value.reloadCanvas();
  }
});
</script>

<style lang="scss" scoped>
.canvas-wrap {
  position: relative;
  width: 100vw;
  height: 100vh;
  margin: 0 auto;
  background-color: transparent;
}

.tool-box-out {
  position: absolute;
  left: 8px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 0;
  height: 100%;
}

.redo-undo-box {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 3;
  display: flex;
}

.zoom-controller-box {
  position: absolute;
  bottom: 8px;
  left: 76px;
  z-index: 3;
}

.controller-box {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 3;
  display: flex;
}

.image-controller {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 3;
  display: flex;
}

.whiteboard-canvas {
  width: 100%;
  height: 100%;
}
</style>
