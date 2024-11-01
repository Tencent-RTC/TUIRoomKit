<template>
  <IconButton class="tool-button" @click-icon="onClick">
    <LaserIcon
      :class="{ 'whiteboard-icon-active': activeTool === DrawingTool.Laser }"
    />
  </IconButton>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue';
import { DrawingTool } from '../type';
import IconButton from '../../common/base/IconButton.vue';
import LaserIcon from './Icon/LaserIcon.vue';

const props = defineProps({
  activeTool: String,
});
const emit = defineEmits(['click']);
const onClick = () => {
  if (props.activeTool === DrawingTool.Laser) {
    return;
  }
  emit('click', {
    drawingTool: DrawingTool.Laser,
  });
};
</script>
