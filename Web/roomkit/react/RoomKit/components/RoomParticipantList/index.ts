import { RoomParticipantList as RoomParticipantListComp } from './RoomParticipantList';

/**
 * @module RoomParticipantListComponent
 * @description Room participant list component
 *
 * Displays the room participant list with support for paged loading, search,
 * calling participants, kicking participants, setting admins, transferring host, etc.
 *
 * @example
 * ```tsx
 * import { RoomParticipantList, useRoomParticipantState } from '@tuikit-atomicx-react/room';
 * import { useEffect } from 'react';
 *
 * function MyPanel() {
 *   const { getParticipantList } = useRoomParticipantState();
 *   useEffect(() => { getParticipantList({ cursor: '' }); }, []);
 *   return (
 *     <div style={{ width: 400, height: '100vh' }}>
 *       <RoomParticipantList />
 *     </div>
 *   );
 * }
 * ```
 */
const RoomParticipantList = RoomParticipantListComp;

// H5-kit reuses these action hooks to render its own participant list drawer /
// per-participant popup / room-wide action bar. Mirrors atomicx-vue3, where the
// RoomKit layer owns `useParticpantAction` / `useRoomAction` as well.
export { useParticipantAction, useAudienceAction } from './useParticipantAction';
export { useRoomActions } from './useRoomAction';
export type { ActionItem } from './useParticipantAction';

export { RoomParticipantList };

// H5 participant list + sub-components. Mirrors atomicx-vue3, where the
// `RoomParticipantList` directory owns both the PC `RoomParticipantList` and
// the H5 `RoomParticipantListH5` plus its sub-components.
export { RoomParticipantListH5 } from './RoomParticipantListH5';
export { ParticipantItemH5 } from './ParticipantItemH5';
export type { ParticipantItemH5Props } from './ParticipantItemH5';
export { ParticipantActionH5 } from './ParticipantActionH5';
export type { ParticipantActionH5Props } from './ParticipantActionH5';
export { PendingParticipantItemH5 } from './PendingParticipantItemH5';
export type { PendingParticipantItemH5Props } from './PendingParticipantItemH5';
export { RoomActionH5 } from './RoomActionH5';
