<template>
  <IconButton class="tool-button" @click-icon="onClick">
    <UndoIcon :class="{ 'tool-disabled': props.step === 0 }" />
  </IconButton>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue';
import { DrawingTool } from '../type';
import IconButton from '../../common/base/IconButton.vue';
import UndoIcon from './Icon/UndoIcon.vue';

const props = defineProps({
  step: Number,
});
const emit = defineEmits(['click']);
const onClick = () => {
  emit('click', {
    drawingTool: DrawingTool.Undo,
  });
};
</script>
