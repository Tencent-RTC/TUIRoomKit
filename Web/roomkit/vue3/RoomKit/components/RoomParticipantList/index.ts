import { addI18n } from 'tuikit-atomicx-vue3';
import { enUSResource, zhCNResource } from './i18n';
import RoomParticipantListComp from './index.vue';
import RoomParticipantListH5Comp from './RoomParticipantListH5.vue';

addI18n('en-US', { translation: enUSResource });
addI18n('zh-CN', { translation: zhCNResource });

/**
 * @module RoomParticipantListComponent
 * @description 房间参与者列表组件
 *
 * 用于展示房间参与者列表，支持分页获取参与者列表，支持搜索参与者，支持呼叫参与者，支持踢出参与者，支持设置参与者为管理员，支持设置参与者为房主等功能。
 *
 * @example
 * <template>
 *   <div class="room-participant-list-container">
 *     <RoomParticipantList />
 *   </div>
 * </template>
 *
 * <script setup>
 * import { RoomParticipantList, useRoomParticipantState } from '@tuikit-atomicx-vue3/room';
 * const { participantList, getParticipantList } = useRoomParticipantState();
 *
 * onMounted(async () => {
 *   await getParticipantList({ cursor: '' });
 * });
 * </script>
 *
 * <style scoped>
 * .room-participant-list-container {
 *   width: 400px;
 *   height: 100vh;
 * }
 * </style>
 */

const RoomParticipantList = RoomParticipantListComp;

/**
 * @module RoomParticipantListH5Component
 * @description 房间参与者列表组件 H5 版本
 *
 * H5 移动端版本的房间参与者列表组件，所有功能按钮使用 Popup 弹窗展示，适配移动端交互体验。
 *
 * @example
 * <template>
 *   <div class="room-participant-list-h5-container">
 *     <RoomParticipantListH5 />
 *   </div>
 * </template>
 *
 * <script setup>
 * import { RoomParticipantListH5 } from '@tuikit-atomicx-vue3/room';
 * </script>
 *
 * <style scoped>
 * .room-participant-list-h5-container {
 *   width: 100%;
 *   height: 100vh;
 * }
 * </style>
 */

const RoomParticipantListH5 = RoomParticipantListH5Comp;

export { RoomParticipantList, RoomParticipantListH5 };
