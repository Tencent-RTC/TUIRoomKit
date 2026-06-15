import { addI18n } from 'tuikit-atomicx-vue3';
import { enResource, zhResource } from './i18n';
import VideoSettingPanelComp from './index.vue';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });


/**
 * @module VideoSettingPanelComponent
 * @description 视频设置面板组件
 *
 * 用于展示视频设置面板，支持自定义视图展示。
 *
 * @props
 * @prop {boolean} cameraSelectVisible - 是否显示摄像头选择，默认 true
 * @prop {boolean} videoPreviewVisible - 是否显示视频预览，默认 true
 * @prop {boolean} videoProfileVisible - 是否显示视频设置，默认 true
 * @prop {boolean} switchMirrorVisible - 是否显示镜像开关，默认 true
 *
 * @example
 * <template>
 *   <VideoSettingPanel />
 * </template>
 *
 * <script setup>
 * import { VideoSettingPanel } from '@tuikit-atomicx-vue3/room';
 * </script>
 *
 * <style scoped>
 * .video-setting-panel-container {
 *   width: 400px;
 *   height: 300px;
 * }
 * </style>
 */
const VideoSettingPanel = VideoSettingPanelComp;

export { VideoSettingPanel };
