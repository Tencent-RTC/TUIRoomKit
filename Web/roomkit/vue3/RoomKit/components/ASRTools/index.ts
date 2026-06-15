/**
 * @module ASRToolsComponent
 * @description 语音识别工具组件
 *
 * 用于在视频会议中显示实时字幕和转录消息列表的语音识别组件。
 */

/**
 * 实时字幕组件
 * @component Subtitle
 * @description 实时字幕组件，用于在语音识别过程中显示说话人姓名和实时转录的文本内容。
 * 字幕会在语音识别完成 3 秒后自动消失。
 *
 * @features
 * - 实时显示语音识别内容
 * - 语音识别完成后自动清除字幕
 * - 支持多说话人同时显示
 * - 响应式布局，支持最大宽度限制
 *
 * @example
 * <template>
 *   <Subtitle />
 * </template>
 *
 * <script setup>
 * import { Subtitle } from 'tuikit-atomicx-vue3';
 * </script>
 */

/**
 * 实时消息列表组件
 * @component RealtimeMessageList
 * @description 实时消息列表组件，用于显示已完成的语音识别消息列表，消息按说话人和时间间隔自动分组。
 * 消息按时间顺序排列，并自动滚动显示最新内容。
 *
 * @features
 * - 按时间顺序显示已完成的语音识别消息
 * - 按说话人和时间间隔（60 秒）自动分组
 * - 智能自动滚动，尊重用户手动滚动行为
 * - 显示每组消息的时间戳
 * - 自定义滚动条样式
 *
 * @example
 * <template>
 *   <RealtimeMessageList />
 * </template>
 *
 * <script setup>
 * import { RealtimeMessageList } from 'tuikit-atomicx-vue3';
 * </script>
 */
import { addI18n } from 'tuikit-atomicx-vue3';
import RealtimeMessageListComponent from './components/RealtimeMessageList.vue';
import SubtitleComponent from './components/Subtitle.vue';
import { enResource, zhResource } from './i18n';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

const Subtitle = SubtitleComponent;
const RealtimeMessageList = RealtimeMessageListComponent;

export { Subtitle, RealtimeMessageList };
