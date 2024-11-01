<template>
  <IconButton
    class="tool-button"
    @click-icon="onClick"
    v-click-outside="handleHideButtonSetting"
  >
    <ArrowIcon
      :class="{ 'whiteboard-icon-active': activeTool === DrawingTool.Arrow }"
    />
    <div
      v-if="showSettings && activeTool === 'Arrow'"
      class="arrow-tool-setting whiteboard-tool-setting"
    >
      <div class="size-setting-title setting-title">{{ t('Arrow Size') }}</div>
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
      <div class="color-setting-title setting-title">
        {{ t('Arrow Color') }}
      </div>
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
import { defineEmits, defineProps, ref, watch, reactive } from 'vue';
import { useI18n } from '../../../../locales';
import { DrawingTool, ToolSettings } from '../../type';
import IconButton from '../../../common/base/IconButton.vue';
import vClickOutside from '../../../../directives/vClickOutside';
import '../whiteboard-tool.scss';

import ArrowIcon from '../Icon/ArrowIcon.vue';
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
import logger from '../../../../utils/common/logger';

const { t } = useI18n();

const lineSizes = [
  { icon: SizeSmall, size: 2 },
  { icon: SizeMid, size: 4 },
  { icon: SizeBig, size: 6 },
  { icon: SizeLarge, size: 8 },
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
const showSettings = ref(false);
const props = defineProps({
  activeTool: String,
});

function handleHideButtonSetting() {
  if (props.activeTool === DrawingTool.Arrow) {
    showSettings.value = false;
  }
}

const toolSetting = reactive<ToolSettings>({
  drawingTool: DrawingTool.Arrow,
  shapeOptions: {
    strokeWidth: 4,
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

const onClick = () => {
  showSettings.value = !showSettings.value;
  emit('click', toolSetting);
  logger.debug('toolSetting', toolSetting);
  logger.debug('emit', showSettings.value);
  logger.debug('emit', showSettings.value);
  logger.debug('emit', showSettings.value);
  logger.debug('emit', showSettings.value);
  logger.debug('emit', showSettings.value);
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
