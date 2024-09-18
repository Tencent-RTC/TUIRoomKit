<template>
  <div class="redo-undo">
    <div class="redo-undo-controller-btn" @click="handleUndo">
      <img :src="step !== 0 ? undo : undoDisabled" />
    </div>
    <div class="redo-undo-controller-btn" @click="handleRedo">
      <img :src="step !== historyList.length ? redo : redoDisabled" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, Ref, watchEffect } from 'vue';
import { ipcRenderer } from 'electron';
import FabricCanvas from './../../core';
import redo from './image/redo.svg';
import undo from './image/undo.svg';
import redoDisabled from './image/redo-disabled.svg';
import undoDisabled from './image/undo-disabled.svg';
import eventBus from '../../../../hooks/useMitt';

const canvas = inject<Ref<FabricCanvas>>('canvas');
const step = ref<number>(0);
const historyList = ref<any>([]);

function renderCanvas(data: any) {
  if (!canvas?.value) return;
  canvas.value.clearCanvas();
  canvas.value.loadFromJSON(data, () => {
    canvas.value.renderAll();
  });
}

function handleUndo() {
  eventBus.emit('exitTextEditing');
  if (!canvas?.value || step.value === 0) return;
  if (step.value > 0) {
    // eslint-disable-next-line no-plusplus
    step.value--;
    if (step.value === 0) {
      canvas?.value.clearCanvas();
    } else {
      const canvasState = historyList.value[step.value - 1];
      renderCanvas(canvasState);
    }
  }
}

function handleRedo() {
  if (!canvas?.value || step.value === historyList.value.length) return;

  if (step.value < historyList.value.length) {
    // eslint-disable-next-line no-plusplus
    step.value++;
    const canvasState = historyList.value[step.value - 1];
    renderCanvas(canvasState);
  }
}

function addToUndoStack() {
  if (!canvas?.value) return;
  const data = canvas.value.toJSON();
  const histroySteps = historyList.value.length;

  if (histroySteps !== step.value) {
    const arrayTemp = historyList.value.slice(0, step.value);
    historyList.value = arrayTemp;
  }

  historyList.value.push(data);
  step.value = historyList.value.length;
}

function addEmptyCanvasToUndoStack() {
  if (historyList.value.length > 0) {
    addToUndoStack();
  }
}

function clearHistoryList() {
  historyList.value = [];
  step.value = 0;
}

function initEvent() {
  if (!canvas?.value) return;
  canvas.value.on('push-canvas-to-stack', addToUndoStack);
  eventBus.on('undo-clear-canvas', addEmptyCanvasToUndoStack);
  // hotkeys(keyNames.ctrlz, handleUndo);
  // hotkeys(keyNames.ctrly, handleRedo);
}

ipcRenderer.on('whiteboard:clear', clearHistoryList);
ipcRenderer.on('annotation:clear', clearHistoryList);

watchEffect(() => {
  if (canvas?.value) {
    initEvent();
  }
});
</script>
<style lang="scss" scoped>
.redo-undo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 32px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
}

.redo-undo-controller-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 2px;
  margin-left: 2px;
  border-radius: 2px;

  &:hover {
    background: rgba(33, 35, 36, 0.1);
  }
}
</style>
