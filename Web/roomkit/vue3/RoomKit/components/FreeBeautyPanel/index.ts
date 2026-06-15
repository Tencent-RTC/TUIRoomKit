/**
 * @module FreeBeautyPanelComponent
 * @description 美颜设置面板组件，用于配置视频通话中的美颜效果，支持磨皮、美白、红润等美颜功能。
 */

import { addI18n } from 'tuikit-atomicx-vue3';
import FreeBeautyPanelComponent from './FreeBeautyPanel.vue';
import { enResource, zhResource } from './i18n';

/**
 * 美颜设置面板组件
 * @component FreeBeautyPanel
 * @description 美颜设置面板组件，用于配置视频通话中的美颜效果，支持磨皮、美白、红润等多种美颜功能。
 *
 * @features
 * - 实时预览美颜效果
 * - 支持磨皮、美白、红润三种美颜类型
 * - 可调节美颜强度（0-100）
 * - 支持美颜效果对比功能（按住对比按钮查看原始画面）
 * - 支持一键重置美颜参数
 * - 美颜参数保存与恢复
 *
 * @emits
 * @emit {void} close - 面板关闭时触发，用于通知父组件关闭面板
 *
 * @example
 * <template>
 *   <FreeBeautyPanel
 *     @close="handleClose"
 *   />
 * </template>
 *
 * <script setup>
 * import { FreeBeautyPanel } from 'tuikit-atomicx-vue3';
 *
 * function handleClose() {
 *   console.log('Panel closed');
 * }
 * </script>
 */
const FreeBeautyPanel = FreeBeautyPanelComponent;

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });
export {
  FreeBeautyPanel,
};
