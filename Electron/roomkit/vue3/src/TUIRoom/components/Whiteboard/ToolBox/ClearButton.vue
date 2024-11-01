<template>
  <IconButton class="tool-button" @click-icon="onClick" :icon="ClearIcon" />
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import { DrawingTool } from '../type';
import IconButton from '../../common/base/IconButton.vue';
import ClearIcon from './Icon/ClearIcon.vue';

const emit = defineEmits(['click']);

const onClick = () => {
  emit('click', {
    drawingTool: DrawingTool.Clear,
  });
};
</script>
