import { addI18n } from 'tuikit-atomicx-vue3';
import { enResource, zhResource } from './i18n';
import AudioSettingPanelComponent from './index.vue';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

/**
 * @module AudioSettingPanelComponent
 * @description 音频设置面板组件
 *
 * 用于展示音频设置面板，支持自定义视图展示。
 *
 * @props
 * @prop {boolean} micTestVisible - 是否显示麦克风测试按钮，默认 true
 * @prop {boolean} inputVolumeLevelVisible - 是否显示输入音量等级，默认 true
 * @prop {boolean} inputVolumeVisible - 是否支持输入音量设置，默认 true
 * @prop {boolean} speakerTestVisible - 是否支持扬声器测试，默认 true
 * @prop {boolean} outputVolumeVisible - 是否支持输出音量设置，默认 true
 *
 * @example
 * <template>
 *   <AudioSettingPanel />
 * </template>
 *
 * <script setup>
 * import { AudioSettingPanel } from '@tuikit-atomicx-vue3/room';
 * </script>
 *
 * <style scoped>
 * .audio-setting-panel-container {
 *   width: 400px;
 *   height: 300px;
 * }
 * </style>
 */
const AudioSettingPanel = AudioSettingPanelComponent;

export { AudioSettingPanel };
