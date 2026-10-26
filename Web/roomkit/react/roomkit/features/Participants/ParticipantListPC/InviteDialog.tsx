import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { TUIToast } from '../../../base';
import { t } from '../../../i18n';
import UserPicker from '../UserPickerPC/UserPickerPC';
import type { PickedContact } from '../UserPickerPC/contactPicker';
import { useInvitation } from './useInvitation';
import { formatNameList, useParticipantList } from './useParticipant';

export interface InviteDialogProps {
  open: boolean;
  onUpdateOpen?: (open: boolean) => void;
  className?: string;
  style?: CSSProperties;
}

export function InviteDialog(props: InviteDialogProps) {
  const { open, onUpdateOpen, className, style } = props;

  const { joinedParticipants } = useParticipantList();
  const { inviteUsers, ringingPending } = useInvitation();

  const occupiedUserIds = useMemo(() => {
    const ids = new Set<string>();
    for (const participant of joinedParticipants) {
      ids.add(participant.userId);
    }
    for (const participant of ringingPending) {
      ids.add(participant.userId);
    }
    return [...ids];
  }, [joinedParticipants, ringingPending]);

  async function confirm(users: PickedContact[]) {
    const userIdList = users.map(user => user.userId);
    const failure = await inviteUsers(userIdList);
    if (failure) {
      TUIToast[failure === 'failed' ? 'error' : 'warning'](t(`Participants.InviteFailure.${failure}`));
      return;
    }
    const names = users.map(user => user.userName || user.userId);
    TUIToast.success(userIdList.length
      ? t('Participants.CallStarted', { name: formatNameList(names) })
      : t('Participants.InviteSent'));
    onUpdateOpen?.(false);
  }

  return (
    <UserPicker
      className={className}
      style={style}
      open={open}
      occupiedIds={occupiedUserIds}
      onUpdateOpen={value => onUpdateOpen?.(value)}
      onConfirm={(users) => {
        void confirm(users);
      }}
    />
  );
}

export default InviteDialog;
