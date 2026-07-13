import {
  IconManageMember,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { useRoomState } from 'tuikit-atomicx-react/room';
import { BuiltinWidget } from '../../adapter/type';
import { useRoomSidePanel } from '../../hooks/useRoomSidePanel';
import { IconButton } from '../base/IconButton';

export function MemberButton() {
  const { t } = useUIKit();
  const { togglePanel } = useRoomSidePanel();
  const { currentRoom } = useRoomState();

  const participantCount = currentRoom?.participantCount || 0;
  const audienceCount = (currentRoom as { audienceCount?: number } | null)?.audienceCount || 0;
  const totalCount = participantCount + audienceCount;
  const title = (currentRoom?.roomId && totalCount > 0)
    ? `${t('Participant.Title')}(${totalCount})`
    : t('Participant.Title');

  const handleClick = () => {
    togglePanel(BuiltinWidget.MemberWidget);
  };

  return (
    <IconButton title={title} onClickIcon={handleClick}>
      <IconManageMember size="24" />
    </IconButton>
  );
}
