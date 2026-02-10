import { createVNode, render } from 'vue';
import type { VNode } from 'vue';
import RoomInvitationH5 from './RoomInvitationH5.vue';
import type { RoomInvitationH5Options } from './RoomInvitationH5.vue';

export const ROOM_INVITATION_H5_CONTAINER_ID = 'room-invitation-h5-container';
let roomInvitationH5Container: HTMLDivElement | null = null;
let currentRoomInvitationH5App: VNode | null = null;

/**
 * Hide current room invitation H5 popup
 */
export const hideRoomInvitationH5 = (): void => {
  if (currentRoomInvitationH5App) {
    render(null, roomInvitationH5Container!);
    currentRoomInvitationH5App = null;
  }
  if (roomInvitationH5Container) {
    document.body.removeChild(roomInvitationH5Container);
    roomInvitationH5Container = null;
  }
};

/**
 * Show room invitation H5 popup
 * @param options Room invitation configuration options
 * @returns Promise<string> Returns user action result: 'accept' | 'cancel' | 'timeout'
 */
export const showRoomInvitationH5 = (options: RoomInvitationH5Options): Promise<string> => new Promise((resolve) => {
  // If there is already an invitation popup displayed, close it first
  if (currentRoomInvitationH5App) {
    hideRoomInvitationH5();
  }

  // Create container
  if (!roomInvitationH5Container) {
    roomInvitationH5Container = document.createElement('div');
    roomInvitationH5Container.id = ROOM_INVITATION_H5_CONTAINER_ID;
    roomInvitationH5Container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
      `;
    document.body.appendChild(roomInvitationH5Container);
  }

  // Wrap callback functions
  const wrappedOptions: RoomInvitationH5Options = {
    ...options,
    onAccept: () => {
      options.onAccept?.();
      hideRoomInvitationH5();
      resolve('accept');
    },
    onCancel: () => {
      options.onCancel?.();
      hideRoomInvitationH5();
      resolve('cancel');
    },
    onTimeout: () => {
      options.onTimeout?.();
      hideRoomInvitationH5();
      resolve('timeout');
    },
  };

  const vNode = createVNode(RoomInvitationH5, {
    options: wrappedOptions,
  });
  currentRoomInvitationH5App = vNode;

  if (roomInvitationH5Container) {
    render(vNode, roomInvitationH5Container);
  }
});

export type { RoomInvitationH5Options };
