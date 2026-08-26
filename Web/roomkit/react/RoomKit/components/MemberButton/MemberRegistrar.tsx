import { useEffect } from 'react';
import { useUIKit } from '@tencentcloud/uikit-base-component-react';
import { RoomParticipantList } from '../RoomParticipantList';
import { BuiltinWidget } from '../../adapter/type';
import { useRoomSidePanel } from '../../hooks/useRoomSidePanel';

/**
 * Registration-only component: mounts the member list panel into the side
 * panel store. Returns null — the actual trigger button (`MemberButton`) must
 * be placed separately in a stable location (e.g. `OverflowBar`) so that
 * layout changes do not unmount this registrar and inadvertently close the
 * panel via the cleanup function.
 */
export function MemberRegistrar() {
  const { t } = useUIKit();
  const { registerSidePanel } = useRoomSidePanel();

  useEffect(
    () => registerSidePanel({
      id: BuiltinWidget.MemberWidget,
      title: () => t('Participant.Title'),
      render: () => <RoomParticipantList />,
    }),
    [registerSidePanel, t],
  );

  return null;
}
