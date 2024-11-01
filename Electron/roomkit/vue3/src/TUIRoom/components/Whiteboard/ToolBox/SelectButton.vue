<template>
  <IconButton class="tool-button" @click-icon="onClick">
    <SelectIcon
      :class="{ 'whiteboard-icon-active': activeTool === DrawingTool.Select }"
    />
  </IconButton>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, watch } from 'vue';
import { DrawingTool } from '../type';
import IconButton from '../../common/base/IconButton.vue';
import SelectIcon from './Icon/SelectIcon.vue';
import logger from '../../../utils/common/logger';

const props = defineProps({
  activeTool: String,
  changeTool: String,
});
const emit = defineEmits(['click']);
watch(
  () => props.changeTool,
  () => {
    if (props.changeTool === DrawingTool.Select) {
      logger.error(
        'changeToochangeToolchangeToolchangeToolchangeToolchangeToolchangeToolchangeToolchangeTooll'
      );
      emit('click', {
        drawingTool: DrawingTool.Select,
      });
    }
  }
);
const onClick = () => {
  if (props.activeTool === DrawingTool.Select) {
    return;
  }
  emit('click', {
    drawingTool: DrawingTool.Select,
  });
};
</script>
