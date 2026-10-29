import { useEffect, useState } from 'react';
import { TUIDialog, TUIInput } from '../../../base';
import { useI18n } from '../../../i18n';
import { useParticipantActions } from '../participantActions';
import { useJoinedParticipant, useParticipantMenu } from '../participantData';
import type { ParticipantCommand } from '../participantData';
import ParticipantActionSheet from './ParticipantActionSheet';
import './ParticipantMemberSheet.scss';

export interface ParticipantMemberSheetProps {
  open: boolean;
  /** Outlives the sheet, so the rename dialog opened from it still knows whom it renames. */
  userId: string;
  onUpdateOpen?: (open: boolean) => void;
}

export function ParticipantMemberSheet(props: ParticipantMemberSheetProps) {
  const { open, userId, onUpdateOpen } = props;
  const { t } = useI18n();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const participant = useJoinedParticipant(userId);
  const { displayName, menuGroups } = useParticipantMenu(participant);
  const { runCommand, rename } = useParticipantActions();

  // The member can leave the room or lose its last action while the sheet is open.
  const hasGroups = menuGroups.length > 0;
  useEffect(() => {
    if (open && !hasGroups) {
      onUpdateOpen?.(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGroups]);

  function onSelect(key: string) {
    onUpdateOpen?.(false);
    if (!participant) {
      return;
    }
    const command = key as ParticipantCommand;
    if (command === 'rename') {
      setNewName(displayName);
      setRenameDialogOpen(true);
      return;
    }
    void runCommand(command, participant);
  }

  async function submitRename() {
    if (participant && await rename(participant, newName)) {
      setRenameDialogOpen(false);
    }
  }

  return (
    <>
      <ParticipantActionSheet open={open} groups={menuGroups} onUpdateOpen={onUpdateOpen} onSelect={onSelect} />

      <TUIDialog
        open={renameDialogOpen}
        title={t('Participants.Rename')}
        closable={false}
        confirmText={t('Participants.Confirm')}
        cancelText={t('Participants.Cancel')}
        confirmDisabled={!newName.trim()}
        onUpdateOpen={setRenameDialogOpen}
        onConfirm={() => {
          void submitRename();
        }}
      >
        <p className="participant-list-mobile-rename-desc">
          {t('Participants.RenameDesc')}
        </p>
        <TUIInput
          modelValue={newName}
          onUpdateModelValue={value => setNewName(String(value ?? ''))}
          placeholder={t('Participants.RenamePlaceholder')}
          maxlength={10}
          onEnter={() => {
            void submitRename();
          }}
        />
      </TUIDialog>
    </>
  );
}

export default ParticipantMemberSheet;
