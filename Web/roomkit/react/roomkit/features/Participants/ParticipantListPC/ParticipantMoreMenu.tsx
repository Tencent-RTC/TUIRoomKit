import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import {
  TUIDialog,
  TUIDropdown,
  TUIDropdownItem,
  TUIDropdownSeparator,
  TUIInput,
  IconMore,
} from '../../../base';
import type { Placement } from '../../../base';
import { useI18n } from '../../../i18n';
import { useParticipantMoreMenu } from './useParticipantMoreMenu';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import './ParticipantMoreMenu.scss';

export interface ParticipantMoreMenuProps {
  participant: RoomParticipant;
  placement?: Placement;
  children?: ReactNode | ((scope: { open: boolean }) => ReactNode);
}

export function ParticipantMoreMenu(props: ParticipantMoreMenuProps) {
  const { participant, placement = 'bottom-end', children } = props;
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const {
    displayName,
    visible,
    menuItems,
    confirmRename,
    runCommand,
  } = useParticipantMoreMenu(participant);

  async function onCommand(command: string | number) {
    if (command === 'rename') {
      setRenameValue(displayName);
      setRenameOpen(true);
      return;
    }
    await runCommand(command);
  }

  function onRenameOpen(next: boolean) {
    setRenameOpen(next);
    if (!next) {
      setRenameValue('');
    }
  }

  async function submitRename() {
    if (!await confirmRename(renameValue)) {
      return;
    }
    setRenameOpen(false);
    setRenameValue('');
  }

  let trigger: ReactNode;
  if (children == null) {
    trigger = (
      <button
        className={['participant-more-trigger', open ? 'is-open' : ''].filter(Boolean).join(' ')}
        type="button"
        title={t('Participants.More')}
        aria-label={t('Participants.More')}
      >
        <IconMore size={14} />
      </button>
    );
  } else if (typeof children === 'function') {
    trigger = children({ open });
  } else {
    trigger = children;
  }

  return (
    <>
      {visible && (
        <TUIDropdown
          trigger="click"
          placement={placement}
          onUpdateOpen={setOpen}
          onCommand={(command) => {
            void onCommand(command);
          }}
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
          {trigger}
        </TUIDropdown>
      )}

      <TUIDialog
        open={renameOpen}
        title={t('Participants.Rename')}
        confirmText={t('Participants.Confirm')}
        cancelText={t('Participants.Cancel')}
        confirmDisabled={!renameValue.trim()}
        onUpdateOpen={onRenameOpen}
        onConfirm={() => {
          void submitRename();
        }}
      >
        <div
          className="participant-rename"
        >
          <p className="participant-rename-desc">
            {t('Participants.RenameDesc')}
          </p>
          <TUIInput
            modelValue={renameValue}
            onUpdateModelValue={value => setRenameValue(String(value ?? ''))}
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
