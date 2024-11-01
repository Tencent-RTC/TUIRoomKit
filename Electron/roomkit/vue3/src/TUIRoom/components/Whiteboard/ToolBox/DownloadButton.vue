<template>
  <IconButton class="tool-button" @click-icon="onClick" :icon="DownloadIcon" />
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import { DrawingTool } from '../type';
import IconButton from '../../common/base/IconButton.vue';
import DownloadIcon from './Icon/DownloadIcon.vue';
const emit = defineEmits(['click']);

const onClick = () => {
  emit('click', {
    drawingTool: DrawingTool.Download,
  });
};
</script>
