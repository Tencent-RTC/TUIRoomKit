<template>
  <IconButton
    class="tool-button"
    @click-icon="onClick"
    v-click-outside="handleHideButtonSetting"
  >
    <PencilIcon
      :class="{ 'whiteboard-icon-active': activeTool === DrawingTool.Pencil }"
    />
    <div
      v-if="showSettings && activeTool === DrawingTool.Pencil"
      class="pen-tool-setting whiteboard-tool-setting"
    >
      <div class="size-setting-title setting-title">{{ t('Line Size') }}</div>
      <div class="size-setting-section setting-section">
        <button
          v-for="lineSize in lineSizes"
          :key="lineSize.size"
          class="size-button setting-option-button"
          @click.stop="handleSizeClick(lineSize.size)"
          :class="{
            'button-active':
              lineSize.size === toolSetting.shapeOptions!.strokeWidth,
          }"
        >
          <img :src="lineSize.icon" />
        </button>
      </div>
      <div class="color-setting-title setting-title">{{ t('Line Color') }}</div>
      <div class="color-setting-section setting-section">
        <button
          v-for="lineColor in lineColors"
          :key="lineColor.color"
          class="color-button setting-option-button"
          @click.stop="handleColorClick(lineColor.color)"
          :class="{
            'button-active':
              lineColor.color === toolSetting.shapeOptions!.stroke,
          }"
        >
          <img :src="lineColor.icon" />
        </button>
      </div>
    </div>
  </IconButton>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, reactive } from 'vue';
import { useI18n } from '../../../../locales';
import { ToolSettings, DrawingTool } from './../../type';
import IconButton from '../../../common/base/IconButton.vue';
import vClickOutside from '../../../../directives/vClickOutside';
import '../whiteboard-tool.scss';

import PencilIcon from '../Icon/PencilIcon.vue';
import SizeSmall from '../Image/SizeSmall.svg';
import SizeMid from '../Image/SizeMid.svg';
import SizeBig from '../Image/SizeBig.svg';
import SizeLarge from '../Image/SizeLarge.svg';
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

const { t } = useI18n();

const lineSizes = [
  { icon: SizeSmall, size: 1 },
  { icon: SizeMid, size: 2 },
  { icon: SizeBig, size: 5 },
  { icon: SizeLarge, size: 10 },
];

const lineColors = [
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

function handleHideButtonSetting() {
  if (props.activeTool === DrawingTool.Pencil) {
    showSettings.value = false;
  }
}

const showSettings = ref(false);
const props = defineProps({
  activeTool: String,
  changeTool: String,
});

const toolSetting = reactive<ToolSettings>({
  drawingTool: DrawingTool.Pencil,
  shapeOptions: {
    strokeWidth: 5,
    stroke: '#22262E',
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

watch(
  () => props.changeTool,
  () => {
    if (props.changeTool === DrawingTool.Pencil) {
      emit('click', toolSetting);
    }
  }
);

const onClick = () => {
  showSettings.value = !showSettings.value;
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
