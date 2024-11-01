<template>
  <div class="whiteboard-tool-box">
    <div class="tool-box-top">
      <div class="tool-box-top-lines">
        <topLines />
      </div>
    </div>
    <div class="box" v-for="tool in filteredTools" :key="tool.id">
      <component
        :is="tool.component"
        @click="setActiveButton"
        :class="{ active: activeTool === tool.id }"
        :active-tool="activeTool"
        :step="props.step"
        :history-list-length="props.historyListLength"
        :change-tool="changeTool"
      />
      <div class="separator-box" v-if="tool.showSeparator === true">
        <separator />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps, computed } from 'vue';
import { getUrlParam } from '../../../utils/utils';
import { ToolSettings } from '../type';

import Select from './SelectButton.vue';
import Laser from './LaserButton.vue';
import Pen from './Pencil/index.vue';
import Shape from './Shape/index.vue';
import Eraser from './EraserButton.vue';
import Arrow from './Arrow/index.vue';
import Text from './Text/index.vue';
import Image from './ImageButton.vue';
import Redo from './RedoButton.vue';
import Undo from './UndoButton.vue';
import Clear from './ClearButton.vue';
import Download from './DownloadButton.vue';
import Retract from './RetractButton.vue';
import TopLines from './Icon/TopLine.vue';
import Separator from './Icon/SeparatorLine.vue';

let isAnnotationWin = false;
const annotationParam = getUrlParam('isAnnotationWin');
if (annotationParam && annotationParam === 'true') {
  isAnnotationWin = true;
}

const props = defineProps({
  step: Number,
  historyListLength: Number,
  changeTool: String,
});

const tools = [
  {
    id: 'Select',
    component: Select,
    showSeparator: false,
    showAnnotationWin: true,
  },
  {
    id: 'Laser',
    component: Laser,
    showSeparator: true,
    showAnnotationWin: true,
  },
  {
    id: 'Pencil',
    component: Pen,
    showSeparator: false,
    showAnnotationWin: true,
  },
  {
    id: 'Shape',
    component: Shape,
    showSeparator: false,
    showAnnotationWin: true,
  },
  {
    id: 'Eraser',
    component: Eraser,
    showSeparator: false,
    showAnnotationWin: true,
  },
  {
    id: 'Arrow',
    component: Arrow,
    showSeparator: false,
    showAnnotationWin: true,
  },
  {
    id: 'Text',
    component: Text,
    showSeparator: true,
    showAnnotationWin: true,
  },
  {
    id: 'Image',
    component: Image,
    showSeparator: false,
    showAnnotationWin: false,
  },
  {
    id: 'Undo',
    component: Undo,
    showSeparator: false,
    showAnnotationWin: true,
  },
  {
    id: 'Redo',
    component: Redo,
    showSeparator: false,
    showAnnotationWin: true,
  },
  {
    id: 'Clear',
    component: Clear,
    showSeparator: false,
    showAnnotationWin: true,
  },
  {
    id: 'Download',
    component: Download,
    showSeparator: false,
    showAnnotationWin: false,
  },
];

const filteredTools = computed(() => {
  const filtered = tools.filter(
    tool => !isAnnotationWin || tool.showAnnotationWin
  );
  const newElement = {
    id: 'Retract',
    component: Retract,
    showSeparator: false,
    showAnnotationWin: true,
  };
  if (isAnnotationWin === true) {
    return [...filtered, newElement];
  }
  return filtered;
});
const activeTool = ref<string>('Pencil');
const emit = defineEmits<{
  (e: 'updateSetting', toolSetting: ToolSettings): void;
}>();

function setActiveButton(toolSetting: ToolSettings): void {
  if (
    toolSetting.drawingTool === 'Redo' ||
    toolSetting.drawingTool === 'Undo' ||
    toolSetting.drawingTool === 'Download' ||
    toolSetting.drawingTool === 'Image' ||
    toolSetting.drawingTool === 'Clear' ||
    toolSetting.drawingTool === 'Retract'
  ) {
    emit('updateSetting', toolSetting);
    return;
  }
  if (
    toolSetting.drawingTool === 'Line' ||
    toolSetting.drawingTool === 'Rectangle' ||
    toolSetting.drawingTool === 'Circle' ||
    toolSetting.drawingTool === 'Triangle'
  ) {
    activeTool.value = 'Shape';
  } else {
    activeTool.value = toolSetting.drawingTool;
  }
  emit('updateSetting', toolSetting);
}
</script>

<style lang="scss">
.whiteboard-tool-box {
  position: absolute;
  left: 8px;
  display: flex;
  flex-direction: column;
  width: 50px;
  height: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow:
    0 8px 40px rgba(70, 98, 140, 0.12),
    0 4px 12px rgba(70, 98, 140, 0.08);

  .tool-box-top {
    position: relative;
    top: 0;
    left: 0;
    order: 0;
    width: 50px;
    height: 20px;
    background: #f2f5fc;
  }

  .tool-box-top-lines {
    position: absolute;
    top: 7px;
    left: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 6px;
  }

  .tool-box-top-lines img {
    width: 30px;
    height: 6px;
  }

  .box {
    position: relative;
    top: 5px;
    left: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    order: 0;
    width: 40px;
    height: 40px;
    margin-top: 2px;

    &:last-child {
      margin-bottom: 8px;
    }
  }

  .tool-button {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    background-color: #fff;
    border: none;
    transition:
      background-color 0.3s ease,
      width 0.3s ease,
      height 0.3s ease,
      border-radius 0.3s ease;
  }

  .tool-button:active,
  .active {
    width: 25px;
    height: 25px;
    background-color: #1c66e5;
    border-radius: 4px;
  }

  .tool-disabled {
    filter: brightness(70%) invert(0.7);
  }

  .separator-box {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    order: 0;
    width: 40px;
    height: 8px;
    margin-top: 40px;
  }

  .separator-box img {
    width: 28px;
    height: 2px;
  }

  .whiteboard-icon-active {
    filter: brightness(0) invert(1);
  }

  .icon-button-container .icon-content-vertical {
    flex-direction: row;
  }
}
</style>
