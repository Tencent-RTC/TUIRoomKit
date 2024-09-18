<template>
  <div class="close-controller">
    <div class="stop-button" @click="stopWhiteboard">
      <img :src="close" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron';
import close from './image/close.svg';
import { getUrlParam } from '../../../../utils/utils';

let isAnnotationWin = false;

function stopWhiteboard() {
  const annotationParam = getUrlParam('isAnnotationWin');
  if (annotationParam && annotationParam === 'true') {
    isAnnotationWin = true;
  }
  if (isAnnotationWin) {
    ipcRenderer.send('annotation:stop-from-annotation-window');
  } else {
    ipcRenderer.send('whiteboard:stop-from-whiteboard-window');
  }
}
</script>

<style lang="scss" scoped>
.close-controller {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
}

.stop-button {
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
