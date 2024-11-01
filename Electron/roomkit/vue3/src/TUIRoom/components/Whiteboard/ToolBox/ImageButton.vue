<template>
  <IconButton class="tool-button" @click-icon="onClick" :icon="ImageIcon" />
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import { DrawingTool } from '../type';
import IconButton from '../../common/base/IconButton.vue';
import ImageIcon from './Icon/ImageIcon.vue';
const emit = defineEmits(['click']);

const onClick = () => {
  emit('click', {
    drawingTool: DrawingTool.Image,
  });
};
</script>
