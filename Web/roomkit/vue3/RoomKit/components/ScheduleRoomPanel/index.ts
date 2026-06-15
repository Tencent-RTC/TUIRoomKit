/**
 * @module ScheduleRoomPanelComponent
 * @description 预约房间管理组件，用于创建和管理预约房间，支持房间预约、参与者管理、安全设置等功能。
 */

import { addI18n } from 'tuikit-atomicx-vue3';
import { enResource, zhResource } from './i18n';
import ScheduledRoomListComponent from './ScheduledRoomList.vue';
import ScheduleRoomPanelComponent from './ScheduleRoomPanel.vue';

/**
 * 预约房间列表组件
 * @component ScheduledRoomList
 * @description 预约房间列表组件，用于展示用户创建的预约房间列表，支持查看房间详情、加入房间等操作。
 *
 * @features
 * - 显示预约房间列表
 * - 房间时间和状态展示
 * - 支持加入房间操作
 * - 支持查看房间详细信息
 *
 * @example
 * <template>
 *   <ScheduledRoomList />
 * </template>
 *
 * <script setup>
 * import { ScheduledRoomList } from 'tuikit-atomicx-vue3';
 * </script>
 */
const ScheduledRoomList = ScheduledRoomListComponent;
/**
 * 预约房间面板组件
 * @component ScheduleRoomPanel
 * @description 预约房间面板组件，用于创建预约房间并配置房间参数，包括房间名称、开始时间、时长、参与者、密码等。
 *
 * @props
 * @prop {boolean} visible - 面板是否可见
 * @prop {string} userName - 用户名称，用于生成默认房间名
 *
 * @emits
 * @emit {void} cancel - 取消预约时触发
 * @emit {string, ScheduleRoomOptions} confirm - 确认预约时触发，返回房间 ID 和预约配置
 *
 * @features
 * - 房间名称设置（最多 25 个字符）
 * - 开始时间和时区选择
 * - 房间时长设置（15 分钟 - 24 小时）
 * - 参与者搜索和添加
 * - 房间密码设置（6 位数字）
 * - 成员管理设置（全员禁麦/禁画）
 * - 表单验证和错误提示
 * - 自动生成唯一房间 ID
 *
 * @example
 * <template>
 *   <ScheduleRoomPanel
 *     :visible="isVisible"
 *     :user-name="userName"
 *     @cancel="handleCancel"
 *     @confirm="handleConfirm"
 *   />
 * </template>
 *
 * <script setup>
 * import { ScheduleRoomPanel } from 'tuikit-atomicx-vue3';
 * import { ref } from 'vue';
 *
 * const isVisible = ref(false);
 * const userName = ref('User');
 *
 * function handleCancel() {
 *   isVisible.value = false;
 * }
 *
 * function handleConfirm(roomId, options) {
 *   console.log('Room scheduled:', roomId, options);
 *   isVisible.value = false;
 * }
 * </script>
 */
const ScheduleRoomPanel = ScheduleRoomPanelComponent;

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });
export {
  ScheduleRoomPanel,
  ScheduledRoomList,
};
