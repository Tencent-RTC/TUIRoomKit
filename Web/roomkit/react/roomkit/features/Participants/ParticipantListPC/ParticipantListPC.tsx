import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  TUIButton,
  TUIDropdown,
  TUIDropdownItem,
  TUIInput,
  IconChevron,
  IconSearch,
  IconUserPlus,
} from '../../../base';
import { useI18n } from '../../../i18n';
import { useParticipantCall, useRoomControlActions } from '../participantActions';
import { useParticipantAutoLoad, useParticipantList, useRoomControls } from '../participantData';
import UserPickerPC from '../UserPickerPC/UserPickerPC';
import ParticipantRow from './ParticipantRow';
import PendingRow from './PendingRow';
import { useSectionFlex } from './useSectionFlex';
import './ParticipantListPC.scss';

export interface ParticipantListPCProps {
  className?: string;
  style?: CSSProperties;
}

export function ParticipantListPC(props: ParticipantListPCProps) {
  const { className, style } = props;
  const { t } = useI18n();

  const [joinedExpanded, setJoinedExpanded] = useState(true);
  const [pendingExpanded, setPendingExpanded] = useState(true);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useParticipantAutoLoad();
  const {
    searchKeyword,
    setSearchKeyword,
    joinedRows,
    pendingRows,
    joinedCount,
    pendingCount,
    hasPending,
    canCallAll,
    occupiedIds,
  } = useParticipantList();
  const { canManageMembers, microphoneControl, cameraControl, screenShareControl } = useRoomControls();
  const { toggleAllMicrophone, toggleAllCamera, toggleAllScreenShare } = useRoomControlActions();
  const { invitePickerOpen, setInvitePickerOpen, openInvitePicker, callAll, inviteContacts } = useParticipantCall();
  const { bodyRef, joinedSectionRef, pendingSectionRef, joinedTall, pendingTall, isBothTall } = useSectionFlex(
    [joinedRows.length, pendingRows.length, joinedExpanded, pendingExpanded, hasPending],
  );

  return (
    <div className={['participant-panel', className ?? ''].filter(Boolean).join(' ')} style={style}>
      <div className="participant-panel-toolbar">
        <TUIInput
          modelValue={searchKeyword}
          onUpdateModelValue={value => setSearchKeyword(String(value ?? ''))}
          className="participant-panel-search"
          type="text"
          size="sm"
          placeholder={t('Participants.SearchPlaceholder')}
          clearable
          prefixSlot={<IconSearch size={14} />}
        />
        <TUIButton
          className="participant-panel-invite"
          variant="ghost"
          size="sm"
          title={t('Participants.Invite')}
          aria-label={t('Participants.Invite')}
          onClick={openInvitePicker}
        >
          <IconUserPlus size={16} />
        </TUIButton>
      </div>

      <div
        ref={bodyRef}
        className={['participant-panel-body', isBothTall ? 'is-both-tall' : ''].filter(Boolean).join(' ')}
      >
        <section
          ref={joinedSectionRef}
          className={['participant-panel-section', joinedTall ? 'is-fill' : ''].filter(Boolean).join(' ')}
        >
          <header className="participant-panel-heading">
            <button
              className="participant-panel-toggle"
              type="button"
              aria-expanded={joinedExpanded}
              title={joinedExpanded ? t('Participants.Collapse') : t('Participants.Expand')}
              onClick={() => setJoinedExpanded(!joinedExpanded)}
            >
              <IconChevron size={12} className={joinedExpanded ? undefined : 'is-collapsed'} />
              <span className="participant-panel-title">{t('Participants.Joined')}</span>
              <span className="participant-panel-count">{joinedCount}</span>
            </button>
          </header>
          {joinedExpanded && (
            <div className="participant-panel-rows">
              {joinedRows.length === 0 && (
                <div className="participant-panel-empty">
                  {t('Participants.Empty')}
                </div>
              )}
              {joinedRows.map(row => <ParticipantRow key={row.userId} row={row} />)}
            </div>
          )}
        </section>

        {hasPending && (
          <section
            ref={pendingSectionRef}
            className={['participant-panel-section', pendingTall ? 'is-fill' : ''].filter(Boolean).join(' ')}
          >
            <header className="participant-panel-heading">
              <button
                className="participant-panel-toggle"
                type="button"
                aria-expanded={pendingExpanded}
                title={pendingExpanded ? t('Participants.Collapse') : t('Participants.Expand')}
                onClick={() => setPendingExpanded(!pendingExpanded)}
              >
                <IconChevron size={12} className={pendingExpanded ? undefined : 'is-collapsed'} />
                <span className="participant-panel-title">{t('Participants.Pending')}</span>
                <span className="participant-panel-count">{pendingCount}</span>
              </button>
              <button
                className="participant-panel-call-all"
                type="button"
                disabled={!canCallAll}
                title={t('Participants.CallAllTip')}
                onClick={(event) => {
                  event.stopPropagation();
                  void callAll();
                }}
              >
                {t('Participants.CallAll')}
              </button>
            </header>
            {pendingExpanded && (
              <div className="participant-panel-rows">
                {pendingRows.length === 0 && (
                  <div className="participant-panel-empty">
                    {t('Participants.Empty')}
                  </div>
                )}
                {pendingRows.map(row => <PendingRow key={row.userId} row={row} />)}
              </div>
            )}
          </section>
        )}
      </div>

      {canManageMembers && (
        <footer className="participant-panel-footer">
          <button
            className={['participant-panel-footer-btn', microphoneControl.active ? 'is-on' : ''].filter(Boolean).join(' ')}
            type="button"
            onClick={() => {
              void toggleAllMicrophone();
            }}
          >
            {microphoneControl.label}
          </button>
          <button
            className={['participant-panel-footer-btn', cameraControl.active ? 'is-on' : ''].filter(Boolean).join(' ')}
            type="button"
            onClick={() => {
              void toggleAllCamera();
            }}
          >
            {cameraControl.label}
          </button>
          <TUIDropdown
            trigger="click"
            placement="top-end"
            onUpdateOpen={setMoreMenuOpen}
            onCommand={() => {
              void toggleAllScreenShare();
            }}
            menuSlot={(
              <div className="participant-panel-menu">
                <TUIDropdownItem
                  command={screenShareControl.key}
                  className={screenShareControl.active ? 'is-on' : undefined}
                >
                  {screenShareControl.label}
                </TUIDropdownItem>
              </div>
            )}
          >
            <button
              className={['participant-panel-footer-btn', moreMenuOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
              type="button"
            >
              {t('Participants.More')}
            </button>
          </TUIDropdown>
        </footer>
      )}

      <UserPickerPC
        open={invitePickerOpen}
        occupiedIds={occupiedIds}
        onUpdateOpen={setInvitePickerOpen}
        onConfirm={(contacts) => {
          void inviteContacts(contacts);
        }}
      />
    </div>
  );
}

export default ParticipantListPC;
