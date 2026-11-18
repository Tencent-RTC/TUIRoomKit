import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import {
  TUIDialog,
  TUIDropdown,
  TUIDropdownItem,
  TUIDropdownSeparator,
  TUIInput,
} from '../../../base';
import type { Placement } from '../../../base';
import { useI18n } from '../../../i18n';
import { useParticipantActions } from '../participantActions';
import { useParticipantMenu } from '../participantData';
import type { ParticipantCommand } from '../participantData';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import './ParticipantMoreMenu.scss';

export interface ParticipantMoreMenuProps {
  participant: RoomParticipant;
  placement?: Placement;
  /** The trigger; a function receives whether the menu is open. */
  children?: ReactNode | ((scope: { open: boolean }) => ReactNode);
}

export function ParticipantMoreMenu(props: ParticipantMoreMenuProps) {
  const { participant, placement = 'bottom-end', children } = props;
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const { displayName, hasMenu, menuItems } = useParticipantMenu(participant);
  const { runCommand, rename } = useParticipantActions();

  function onCommand(command: string | number) {
    const next = command as ParticipantCommand;
    if (next === 'rename') {
      setNewName(displayName);
      setRenameDialogOpen(true);
      return;
    }
    void runCommand(next, participant);
  }

  async function submitRename() {
    if (await rename(participant, newName)) {
      setRenameDialogOpen(false);
    }
  }

  return (
    <>
      {hasMenu && (
        <TUIDropdown
          trigger="click"
          placement={placement}
          onUpdateOpen={setOpen}
          onCommand={onCommand}
          menuSlot={(
            <div className="participant-more-menu">
              {menuItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Fragment key={item.command}>
                    {item.separatorBefore && <TUIDropdownSeparator />}
                    <TUIDropdownItem command={item.command} danger={item.danger}>
                      <ItemIcon size={16} />
                      {item.label}
                    </TUIDropdownItem>
                  </Fragment>
                );
              })}
            </div>
          )}
        >
          {typeof children === 'function' ? children({ open }) : children}
        </TUIDropdown>
      )}

      <TUIDialog
        open={renameDialogOpen}
        title={t('Participants.Rename')}
        confirmText={t('Participants.Confirm')}
        cancelText={t('Participants.Cancel')}
        confirmDisabled={!newName.trim()}
        onUpdateOpen={setRenameDialogOpen}
        onConfirm={() => {
          void submitRename();
        }}
      >
        <div className="participant-rename">
          <p className="participant-rename-desc">
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
        </div>
      </TUIDialog>
    </>
  );
}

export default ParticipantMoreMenu;
