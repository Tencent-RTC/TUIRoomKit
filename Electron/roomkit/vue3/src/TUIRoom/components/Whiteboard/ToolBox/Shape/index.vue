<template>
  <IconButton
    class="tool-button"
    @click-icon="onClick"
    v-click-outside="handleHideButtonSetting"
  >
    <ShapeIcon :class="{ 'whiteboard-icon-active': activeTool === 'Shape' }" />
    <div
      v-if="showSettings && activeTool === 'Shape'"
      class="shape-tool-setting whiteboard-tool-setting"
    >
      <div class="type-setting-title setting-title">{{ t('Shape Type') }}</div>
      <div class="type-setting-section setting-section">
        <button
          v-for="shapeType in shapeTypes"
          :key="shapeType.shape"
          class="type-button setting-option-button"
          @click.stop="handleTypeClick(shapeType.shape)"
          :class="{
            'button-active': shapeType.shape === toolSetting.drawingTool,
          }"
        >
          <img :src="shapeType.icon" />
        </button>
      </div>
      <div class="style-setting-title setting-title">
        {{ t('Shape Style') }}
      </div>
      <div class="style-setting-section setting-section">
        <button
          v-for="shapeStyle in shapeStyles"
          :key="shapeStyle.style"
          class="style-button setting-option-button"
          @click.stop="handleStyleClick(shapeStyle.style)"
          :class="{
            'button-active':
              toolSetting.shapeOptions!.lineDash![1] === 5
                ? shapeStyle.style === 'dashed'
                : shapeStyle.style === 'solid',
          }"
        >
          <img :src="shapeStyle.icon" />
        </button>
      </div>
      <div class="size-setting-title setting-title">{{ t('Shape Size') }}</div>
      <div class="size-setting-section setting-section">
        <button
          v-for="shapeSize in shapeSizes"
          :key="shapeSize.size"
          class="size-button setting-option-button"
          @click.stop="handleSizeClick(shapeSize.size)"
          :class="{
            'button-active':
              shapeSize.size === toolSetting.shapeOptions?.strokeWidth,
          }"
        >
          <img :src="shapeSize.icon" />
        </button>
      </div>
      <div class="color-setting-title setting-title">
        {{ t('Shape Color') }}
      </div>
      <div class="color-setting-section setting-section">
        <button
          v-for="shapeColor in shapeColors"
          :key="shapeColor.color"
          class="color-button setting-option-button"
          @click.stop="handleColorClick(shapeColor.color)"
          :class="{
            'button-active':
              shapeColor.color === toolSetting.shapeOptions?.stroke,
          }"
        >
          <img :src="shapeColor.icon" alt="Color Icon" />
        </button>
      </div>
    </div>
  </IconButton>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, reactive } from 'vue';
import { ToolSettings, DrawingTool } from '../../type';
import { useI18n } from '../../../../locales';
import vClickOutside from '../../../../directives/vClickOutside';
import IconButton from '../../../common/base/IconButton.vue';
import '../whiteboard-tool.scss';

import ShapeIcon from '../Icon/ShapeIcon.vue';
import SizeSmall from '../Image/SizeSmall.svg';
import SizeMid from '../Image/SizeMid.svg';
import SizeBig from '../Image/SizeBig.svg';
import SizeLarge from './../Image/SizeLarge.svg';
import BlueIcon from '../Image/BlueIcon.svg';
import PurpleIcon from '../Image/PurpleIcon.svg';
import YellowIcon from '../Image/YellowIcon.svg';
import OrangeIcon from '../Image/OrangeIcon.svg';
import RedIcon from '../Image/RedIcon.svg';
import GreenIcon from '../Image/GreenIcon.svg';
import DeepBlueIcon from '../Image/DeepBlueIcon.svg';
import BlackIcon from '../Image/BlackIcon.svg';
import DarkGrayIcon from '../Image/DarkGrayIcon.svg';
import GrayIcon from '../Image/GrayIcon.svg';
import LightGrayIcon from '../Image/LightGrayIcon.svg';
import WhiteIcon from '../Image/WhiteIcon.svg';
import Rectangle from '../Image/ShapeRectangle.svg';
import Circle from '../Image/ShapeCircle.svg';
import Dashed from '../Image/StyleDashed.svg';
import Line from '../Image/ShapeLine.svg';
import Solid from '../Image/StyleSolid.svg';
import Triangle from '../Image/ShapeTriangle.svg';

const { t } = useI18n();

const shapeTypes = [
  { icon: Line, shape: DrawingTool.Line },
  { icon: Circle, shape: DrawingTool.Circle },
  { icon: Rectangle, shape: DrawingTool.Rectangle },
  { icon: Triangle, shape: DrawingTool.Triangle },
];

const shapeStyles = [
  { icon: Solid, style: 'solid' },
  { icon: Dashed, style: 'dashed' },
];

const shapeSizes = [
  { icon: SizeSmall, size: 1 },
  { icon: SizeMid, size: 2 },
  { icon: SizeBig, size: 5 },
  { icon: SizeLarge, size: 10 },
];

const shapeColors = [
  { color: '#4791FF', icon: BlueIcon },
  { color: '#5940D7', icon: PurpleIcon },
  { color: '#F5C342', icon: YellowIcon },
  { color: '#E05734', icon: OrangeIcon },
  { color: '#DC3859', icon: RedIcon },
  { color: '#1AD32C', icon: GreenIcon },
  { color: '#104683', icon: DeepBlueIcon },
  { color: '#22262E', icon: BlackIcon },
  { color: '#86909A', icon: DarkGrayIcon },
  { color: '#B5BBC3', icon: GrayIcon },
  { color: '#DBDDE2', icon: LightGrayIcon },
  { color: '#EAEEF3', icon: WhiteIcon },
];

const showSettings = ref(false);
const props = defineProps({
  activeTool: String,
});

function handleHideButtonSetting() {
  if (props.activeTool === 'Shape') {
    showSettings.value = false;
  }
}

const toolSetting = reactive<ToolSettings>({
  drawingTool: DrawingTool.Rectangle,
  shapeOptions: {
    strokeWidth: 5,
    stroke: '#22262E',
    fill: 'transparent',
    opacity: 1,
    lineDash: [0, 0],
  },
});

const emit = defineEmits<{
  (e: 'click', toolSetting: ToolSettings): void;
}>();

watch(
  () => props.activeTool,
  () => {
    showSettings.value = false;
  }
);

const onClick = () => {
  showSettings.value = !showSettings.value;
  emit('click', toolSetting);
};

const handleTypeClick = (type: DrawingTool) => {
  if (toolSetting.drawingTool === type) {
    return;
  }
  toolSetting.drawingTool = type;
  emit('click', toolSetting);
};

const handleStyleClick = (style: string) => {
  if ('solid' === style) {
    toolSetting.shapeOptions!.lineDash = [0, 0];
    return;
  }
  toolSetting.shapeOptions!.lineDash = [5, 5];
  emit('click', toolSetting);
};

const handleSizeClick = (size: number) => {
  if (size === toolSetting.shapeOptions?.strokeWidth) {
    return;
  }
  toolSetting.shapeOptions!.strokeWidth = size;
  emit('click', toolSetting);
};

const handleColorClick = (color: string) => {
  if (toolSetting.shapeOptions!.stroke !== color) {
    toolSetting.shapeOptions!.stroke = color;
    emit('click', toolSetting);
  }
};
</script>
