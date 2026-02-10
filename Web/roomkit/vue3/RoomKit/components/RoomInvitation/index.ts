import { createVNode, render } from 'vue';
import type { VNode } from 'vue';
import RoomInvitation from './RoomInvitation.vue';
import type { RoomInvitationOptions } from './RoomInvitation.vue';

export const ROOM_INVITATION_CONTAINER_ID = 'room-invitation-container';
let roomInvitationContainer: HTMLDivElement | null = null;
let currentRoomInvitationApp: VNode | null = null;

/**
 * 隐藏当前会议邀请弹窗
 */
export const hideRoomInvitation = (): void => {
  if (currentRoomInvitationApp) {
    render(null, roomInvitationContainer!);
    currentRoomInvitationApp = null;
  }
  if (roomInvitationContainer) {
    document.body.removeChild(roomInvitationContainer);
    roomInvitationContainer = null;
  }
};

/**
 * 显示会议邀请弹窗
 * @param options 会议邀请配置选项
 * @returns Promise<string> 返回用户操作结果: 'accept' | 'cancel' | 'timeout'
 */
export const showRoomInvitation = (options: RoomInvitationOptions): Promise<string> => new Promise((resolve) => {
  // 如果已有邀请弹窗在显示，先关闭
  if (currentRoomInvitationApp) {
    hideRoomInvitation();
  }

  // 创建容器
  if (!roomInvitationContainer) {
    roomInvitationContainer = document.createElement('div');
    roomInvitationContainer.id = ROOM_INVITATION_CONTAINER_ID;
    roomInvitationContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10000;
      `;
    document.body.appendChild(roomInvitationContainer);
  }

  // 包装回调函数
  const wrappedOptions: RoomInvitationOptions = {
    ...options,
    onAccept: () => {
      options.onAccept?.();
      hideRoomInvitation();
      resolve('accept');
    },
    onCancel: () => {
      options.onCancel?.();
      hideRoomInvitation();
      resolve('cancel');
    },
    onTimeout: () => {
      options.onTimeout?.();
      hideRoomInvitation();
      resolve('timeout');
    },
  };

  const vNode = createVNode(RoomInvitation, {
    options: wrappedOptions,
  });
  currentRoomInvitationApp = vNode;

  if (roomInvitationContainer) {
    render(vNode, roomInvitationContainer);
  }
});

export type { RoomInvitationOptions };