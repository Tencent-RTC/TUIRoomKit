<template>
  <div>
    <div class="save-controller">
      <button class="save-button" @click="downloadCanvas">
        <img src="./image/download.svg" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, Ref } from 'vue';
import FabricCanvas from './../../core';

const canvas = inject<Ref<FabricCanvas>>('canvas');

function generateImageName() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const formattedMonth = month < 10 ? `0${month}` : month;
  const formattedDay = day < 10 ? `0${day}` : day;
  const formattedHours = hours < 10 ? `0${hours}` : hours;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  return `${year}-${formattedMonth}-${formattedDay}-${formattedHours}.${formattedMinutes}.${formattedSeconds}.png`;
}

function downloadCanvas() {
  if (!canvas || !canvas.value) {
    return;
  }
  const dataURL = canvas.value.toDataURL({
    format: 'png',
  } as any);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = dataURL;
  link.download = generateImageName();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<style lang="scss" scoped>
.save-controller {
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

.save-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 2px;
  margin-left: 2px;
  background-color: white;
  border: none;

  &:hover {
    background: rgba(33, 35, 36, 0.1);
  }
}
</style>
