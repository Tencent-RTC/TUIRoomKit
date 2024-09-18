<template>
  <div class="tool-mid-box-left">
    <div
      class="tool-box-cell-box-left"
      v-for="item in tools"
      :key="item.shapeType"
    >
      <div class="tool-box-cell" @click="clickAppliance(item.shapeType)">
        <img
          :src="
            item.shapeType === currentShapType ? item.iconActive : item.icon
          "
        />
      </div>
    </div>
    <div class="tool-box-cell-box-left">
      <div class="tool-box-cell" @click="clickClear">
        <img :src="clear" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, Ref } from 'vue';
import FabricCanvas, { DrawingTool } from './../../core';
import selector from './image/selector.svg';
import selectorActive from './image/selector-active.svg';
import pen from './image/pencil.svg';
import penActive from './image/pencil-active.svg';
import text from './image/text.svg';
import textActive from './image/text-active.svg';
import eraser from './image/eraser.svg';
import eraserActive from './image/eraser-active.svg';
import arrow from './image/arrow.svg';
import arrowActive from './image/arrow-active.svg';
import ellipse from './image/ellipse.svg';
import ellipseActive from './image/ellipse-active.svg';
import rectangle from './image/rectangle.svg';
import rectangleActive from './image/rectangle-active.svg';
import straight from './image/straight.svg';
import straightActive from './image/straight-active.svg';
import triangle from './image/triangle.svg';
import triangleActive from './image/triangle-active.svg';
import clear from './image/clear.svg';
import eventBus from '../../../../hooks/useMitt';

const canvas = inject<Ref<FabricCanvas>>('canvas');

type Appliance = {
  readonly name: string;
  readonly icon: string;
  readonly iconActive: string;
  readonly shapeType: DrawingTool;
};
const tools = ref<Appliance[]>([
  {
    name: 'select',
    icon: selector,
    iconActive: selectorActive,
    shapeType: 'select',
  },
  {
    name: 'pencil',
    icon: pen,
    iconActive: penActive,
    shapeType: 'pencil',
  },
  {
    name: 'text',
    icon: text,
    iconActive: textActive,
    shapeType: 'text',
  },
  {
    name: 'eraser',
    icon: eraser,
    iconActive: eraserActive,
    shapeType: 'eraser',
  },
  {
    name: 'triangle',
    icon: triangle,
    iconActive: triangleActive,
    shapeType: 'triangle',
  },
  {
    name: 'ellipse',
    icon: ellipse,
    iconActive: ellipseActive,
    shapeType: 'circle',
  },
  {
    name: 'rectangle',
    icon: rectangle,
    iconActive: rectangleActive,
    shapeType: 'rectangle',
  },
  {
    name: 'straight',
    icon: straight,
    iconActive: straightActive,
    shapeType: 'line',
  },
  {
    name: 'arrow',
    icon: arrow,
    iconActive: arrowActive,
    shapeType: 'arrow',
  },
]);

const currentShapType = ref<string>('pencil');

function clickAppliance(type: DrawingTool) {
  currentShapType.value = type;
  canvas?.value.setDrawingTool(type);
}

function clickClear() {
  canvas?.value.clearCanvas();
  // eslint-disable-next-line no-undef
  eventBus.emit('undo-clear-canvas');
}
</script>
<style lang="scss" scoped>
.tool-mid-box {
  display: flex;
  justify-content: space-between;
  height: 32px;
  padding-right: 6px;
  padding-left: 6px;
  background-color: white;
  border-radius: 4px;
}

.tool-mid-box-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 40px;
  padding-top: 4px;
  padding-bottom: 4px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.1);
}

.tool-box-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.tool-box-cell-color {
  width: 14px;
  height: 14px;
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 8px;
}

.tool-box-cell-subscript {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
}

.tool-box-cell-box-left {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  user-select: none;
  border-radius: 2px;

  &:hover {
    background: rgba(33, 35, 36, 0.1);
  }
}

.tool-box-cell-step-two {
  height: 2px;
  margin-top: -4px;
  margin-right: auto;
  margin-left: auto;
  border-radius: 1px;
}

.palette-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 188px;
}

.palette-box-color {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 188px;
}

.stroke-script {
  display: flex;
  justify-content: space-between;
  width: 156px;
  height: 17px;
  margin-bottom: 16px;
}

.stroke-script-text {
  height: 17px;
  font-family: sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 17px;
  color: rgba(33, 35, 36, 1);
}

.draw-tool-box-title {
  width: 100%;

  div {
    margin-top: 8px;
    margin-bottom: 8px;
    margin-left: 16px;
    font-weight: bold;
  }
}

.palette-stroke-under-layer {
  position: absolute;
  z-index: 1;
  width: 242px;
  height: 32px;
}

.palette-stroke-slider-mask {
  position: absolute;
  z-index: 3;
  display: flex;
  justify-content: center;
  width: 290px;
  height: 32px;
}
</style>
