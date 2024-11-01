<template>
  <IconButton class="tool-button" @click-icon="onClick">
    <EraserIcon
      :class="{ 'whiteboard-icon-active': activeTool === DrawingTool.Eraser }"
    />
  </IconButton>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue';
import { DrawingTool } from '../type';
import IconButton from '../../common/base/IconButton.vue';
import EraserIcon from './Icon/EraserIcon.vue';
const props = defineProps({
  activeTool: String,
});
const emit = defineEmits(['click']);
const onClick = () => {
  if (props.activeTool === DrawingTool.Eraser) {
    return;
  }
  emit('click', {
    drawingTool: DrawingTool.Eraser,
  });
};
</script>
