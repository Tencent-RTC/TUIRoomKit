<template>
  <div>
    <div class="image-controller">
      <button class="upload-button" @click="insertImage">
        <img :src="folder" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, Ref } from 'vue';
import FabricCanvas from './../../core';
import folder from './image/folder.svg';
import logger from '../../../../utils/common/logger';
const canvas = inject<Ref<FabricCanvas>>('canvas');

function insertImage() {
  if (!canvas || !canvas.value) {
    logger.error('Canvas is not available or not initialized.');
    return;
  }
  const input = document.createElement('input');
  input.type = 'file';
  const mimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'].join(
    ','
  );
  input.accept = mimeTypes;
  input.onchange = event => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      logger.info('No file selected.');
      return;
    }
    const validTypes = mimeTypes.split(',').map(type => type.trim());
    if (!validTypes.includes(file.type)) {
      logger.error(
        'Invalid file type. Please upload a PNG, JPEG, JPG, or BMP image.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        canvas.value.insertImage(img.src);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      logger.error('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };
  input.onerror = () => {
    logger.error('Failed to create file input.');
  };
  input.click();
}
</script>

<style lang="scss" scoped>
.image-controller {
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

.upload-button {
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
