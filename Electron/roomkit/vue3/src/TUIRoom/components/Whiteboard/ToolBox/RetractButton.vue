<template>
  <IconButton class="tool-button" @click-icon="onClick" :icon="RetractIcon" />
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import { DrawingTool } from '../type';
import IconButton from '../../common/base/IconButton.vue';
import RetractIcon from './Icon/RetractIcon.vue';

const emit = defineEmits(['click']);
const onClick = () => {
  emit('click', {
    drawingTool: DrawingTool.Retract,
  });
};
</script>
