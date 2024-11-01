<template>
  <IconButton class="tool-button" @click-icon="onClick">
    <RedoIcon :class="{ 'tool-disabled': isRedoDisabled }" />
  </IconButton>
</template>
<script setup lang="ts">
import { defineEmits, computed, defineProps } from 'vue';
import { DrawingTool } from '../type';
import IconButton from '../../common/base/IconButton.vue';
import RedoIcon from './Icon/RedoIcon.vue';

const props = defineProps({
  step: Number,
  historyListLength: Number,
});
const isRedoDisabled = computed(() => {
  return (props.step as number) >= (props.historyListLength as number);
});
const emit = defineEmits(['click']);
const onClick = () => {
  emit('click', {
    drawingTool: DrawingTool.Redo,
  });
};
</script>
