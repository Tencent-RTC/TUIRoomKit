/**
 * @module VirtualBackgroundPanelComponent
 * @description 虚拟背景设置面板组件
 *
 * 用于配置视频通话中的虚拟背景效果，支持背景模糊和自定义背景图片。
 */

import { addI18n } from 'tuikit-atomicx-vue3';
import { enResource, zhResource } from './i18n';
import VirtualBackgroundPanelComponent from './VirtualBackgroundPanel.vue';

/**
 * 虚拟背景设置面板组件
 * @component VirtualBackgroundPanel
 * @description 虚拟背景设置面板组件，用于配置视频通话中的虚拟背景效果，支持背景模糊和自定义背景图片。
 *
 * @props
 * @prop {string} assetsPath - 虚拟背景资源文件路径，用于加载虚拟背景所需的模型和图片资源
 * @prop {CustomBackgroundImage[]} customImages - 自定义背景图片列表，用于展示用户自定义的虚拟背景图片
 *
 * @emits
 * @emit {void} close - 面板关闭时触发，用于通知父组件关闭面板
 *
 * @example
 * <template>
 *   <VirtualBackgroundPanel
 *     :assets-path="assetsPath"
 *     :custom-images="customImages"
 *     @close="handleClose"
 *   />
 * </template>
 *
 * <script setup>
 * import { VirtualBackgroundPanel } from 'tuikit-atomicx-vue3';
 *
 * const assetsPath = 'https://web.sdk.qcloud.com/hybrid/trtc-sdk-v5/assets';
 * const customImages = [
 *   { url: 'https://example.com/bg1.jpg', label: 'Office' },
 *   { url: 'https://example.com/bg2.jpg' },
 * ];
 *
 * function handleClose() {
 *   console.log('Panel closed');
 * }
 * </script>
 */
const VirtualBackgroundPanel = VirtualBackgroundPanelComponent;

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });
export {
  VirtualBackgroundPanel,
};
