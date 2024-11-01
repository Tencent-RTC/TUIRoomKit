<template>
  <IconButton
    class="tool-button"
    v-bind="$attrs"
    @click-icon="onClick"
    v-click-outside="handleHideButtonSetting"
  >
    <TextIcon
      :class="{ 'whiteboard-icon-active': activeTool === DrawingTool.Text }"
    />
    <div
      v-if="showSettings && activeTool === 'Text'"
      class="text-tool-setting whiteboard-tool-setting"
    >
      <div class="size-setting-title setting-title">{{ t('Text Size') }}</div>
      <div class="size-setting-section setting-section">
        <button
          v-for="textSize in textSizes"
          :key="textSize.size"
          class="size-button setting-option-button"
          @click.stop="handleSizeClick(textSize.size)"
          :class="{
            'button-active':
              textSize.size === toolSetting.shapeOptions!.strokeWidth,
          }"
        >
          <img :src="textSize.icon" />
        </button>
      </div>
      <div class="color-setting-title setting-title">{{ t('Text Color') }}</div>
      <div class="color-setting-section setting-section">
        <button
          v-for="textColor in textColors"
          :key="textColor.color"
          class="color-button setting-option-button"
          @click.stop="handleColorClick(textColor.color)"
          :class="{
            'button-active':
              textColor.color === toolSetting.shapeOptions!.stroke,
          }"
        >
          <img :src="textColor.icon" />
        </button>
      </div>
    </div>
  </IconButton>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, reactive } from 'vue';
import { ToolSettings, DrawingTool } from './../../type';
import { useI18n } from '../../../../locales';
import IconButton from '../../../common/base/IconButton.vue';
import vClickOutside from '../../../../directives/vClickOutside';
import '../whiteboard-tool.scss';

import TextIcon from '../Icon/TextIcon.vue';
import SizeIcon1 from '../Image/H1.svg';
import SizeIcon2 from '../Image/H2.svg';
import SizeIcon3 from '../Image/H3.svg';
import SizeIcon4 from '../Image/H4.svg';
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

const textSizes = [
  { icon: SizeIcon1, size: 32 },
  { icon: SizeIcon2, size: 24 },
  { icon: SizeIcon3, size: 18.72 },
  { icon: SizeIcon4, size: 16 },
];

const textColors = [
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
  if (props.activeTool === DrawingTool.Text) {
    showSettings.value = false;
  }
}
const toolSetting = reactive<ToolSettings>({
  drawingTool: DrawingTool.Text,
  shapeOptions: {
    strokeWidth: 18.72,
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
};

const handleSizeClick = (size: number) => {
  if (size === toolSetting.shapeOptions!.strokeWidth) {
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
