import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  IconChevron,
  IconSearch,
  IconUserPlus,
  TUIInput,
} from '../../../base';
import { useI18n } from '../../../i18n';
import { useParticipantCall, useRoomControlActions } from '../participantActions';
import { useParticipantAutoLoad, useParticipantList, useRoomControls } from '../participantData';
import UserPickerMobile from '../UserPickerMobile/UserPickerMobile';
import ParticipantActionSheet from './ParticipantActionSheet';
import ParticipantMemberSheet from './ParticipantMemberSheet';
import ParticipantRow from './ParticipantRow';
import PendingRow from './PendingRow';
import './ParticipantListMobile.scss';

export interface ParticipantListMobileProps {
  className?: string;
  style?: CSSProperties;
}

export function ParticipantListMobile(props: ParticipantListMobileProps) {
  const { className, style } = props;
  const { t } = useI18n();

  const [joinedExpanded, setJoinedExpanded] = useState(true);
  const [pendingExpanded, setPendingExpanded] = useState(true);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  useParticipantAutoLoad();
  const {
    searchKeyword,
    setSearchKeyword,
    isSearching,
    isSearchEmpty,
    searchEmptyParts,
    joinedRows,
    pendingRows,
    joinedCount,
    pendingCount,
    canCallAll,
    occupiedIds,
  } = useParticipantList();
  const { canManageMembers, microphoneControl, cameraControl, screenShareControl } = useRoomControls();
  const { toggleAllMicrophone, toggleAllCamera, toggleAllScreenShare } = useRoomControlActions();
  const { invitePickerOpen, setInvitePickerOpen, openInvitePicker, callAll, inviteContacts } = useParticipantCall();

  function openMemberSheet(userId: string) {
    setSelectedUserId(userId);
    setMemberSheetOpen(true);
  }

  return (
    <div className={['participant-list-mobile', className ?? ''].filter(Boolean).join(' ')} style={style}>
      <div className="participant-list-mobile-body">
        <div className="participant-list-mobile-toolbar">
          <TUIInput
            modelValue={searchKeyword}
            onUpdateModelValue={value => setSearchKeyword(String(value ?? ''))}
            className="participant-list-mobile-search"
            size="sm"
            placeholder={t('Participants.SearchPlaceholder')}
            prefixSlot={<IconSearch className="participant-list-mobile-search-icon" size={14} />}
          />
          <div
            className="participant-list-mobile-invite"
            role="button"
            tabIndex={0}
            aria-label={t('Participants.Invite')}
            onClick={openInvitePicker}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                openInvitePicker();
              }
            }}
          >
            <IconUserPlus size={16} />
          </div>
        </div>

        {isSearchEmpty
          ? (
            <div className="participant-list-mobile-empty">
              <svg className="participant-list-mobile-empty-art" viewBox="0 0 80 64" fill="none" aria-hidden="true">
                <rect className="art-card" x="4" y="8" width="52" height="44" rx="12" />
                <circle className="art-dim" cx="19" cy="22" r="6" />
                <rect className="art-dim" x="30" y="18" width="16" height="4" rx="2" />
                <rect className="art-faint" x="30" y="25" width="10" height="3" rx="1.5" />
                <circle className="art-dim" cx="19" cy="39" r="6" />
                <rect className="art-dim" x="30" y="35" width="13" height="4" rx="2" />
                <rect className="art-faint" x="30" y="42" width="8" height="3" rx="1.5" />
                <circle className="art-lens" cx="56" cy="40" r="12" />
                <path className="art-handle" d="M64.5 48.5 72 56" />
                <path className="art-mark" d="M52 36l8 8M60 36l-8 8" />
              </svg>
              <div className="participant-list-mobile-empty-title">
                {t('Participants.SearchEmpty')}
              </div>
              <div className="participant-list-mobile-empty-desc">
                {searchEmptyParts.before}
                <mark>{searchEmptyParts.query}</mark>
                {searchEmptyParts.after}
              </div>
              <div className="participant-list-mobile-empty-actions">
                <div className="participant-list-mobile-empty-btn" role="button" tabIndex={0} onClick={() => setSearchKeyword('')}>
                  {t('Participants.ClearSearch')}
                </div>
                <div className="participant-list-mobile-empty-btn is-primary" role="button" tabIndex={0} onClick={openInvitePicker}>
                  {t('Participants.Invite')}
                </div>
              </div>
            </div>
          )
          : (
            <>
              <section className="participant-list-mobile-section">
                <div className="participant-list-mobile-section-bar">
                  <div
                    className="participant-list-mobile-section-toggle"
                    role="button"
                    tabIndex={0}
                    aria-expanded={joinedExpanded}
                    onClick={() => setJoinedExpanded(!joinedExpanded)}
                  >
                    <IconChevron
                      className={['participant-list-mobile-section-chev', joinedExpanded ? '' : 'is-collapsed'].filter(Boolean).join(' ')}
                      size={12}
                    />
                    <span>{t('Participants.Joined')}</span>
                    <span className="participant-list-mobile-section-count">{joinedCount}</span>
                  </div>
                </div>
                {joinedExpanded && (
                  <div className="participant-list-mobile-section-body">
                    {joinedRows.map(row => <ParticipantRow key={row.userId} row={row} onSelect={openMemberSheet} />)}
                  </div>
                )}
              </section>

              {(!isSearching || pendingRows.length > 0) && (
                <section className="participant-list-mobile-section">
                  <div className="participant-list-mobile-section-bar">
                    <div
                      className="participant-list-mobile-section-toggle"
                      role="button"
                      tabIndex={0}
                      aria-expanded={pendingExpanded}
                      onClick={() => setPendingExpanded(!pendingExpanded)}
                    >
                      <IconChevron
                        className={['participant-list-mobile-section-chev', pendingExpanded ? '' : 'is-collapsed'].filter(Boolean).join(' ')}
                        size={12}
                      />
                      <span>{t('Participants.Pending')}</span>
                      <span className="participant-list-mobile-section-count">{pendingCount}</span>
                    </div>
                    {pendingRows.length > 0 && (
                      <div
                        className={['participant-list-mobile-call-all', canCallAll ? '' : 'is-disabled'].filter(Boolean).join(' ')}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          void callAll();
                        }}
                      >
                        {t('Participants.CallAll')}
                      </div>
                    )}
                  </div>
                  {pendingExpanded && (
                    <div className="participant-list-mobile-section-body">
                      {pendingRows.length === 0 && (
                        <div className="participant-list-mobile-section-empty">
                          {t('Participants.WaitingEmpty')}
                        </div>
                      )}
                      {pendingRows.map(row => <PendingRow key={row.userId} row={row} />)}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
      </div>

      {canManageMembers && (
        <footer className="participant-list-mobile-footer">
          <div
            className={['participant-list-mobile-footer-btn', microphoneControl.active ? 'is-on' : ''].filter(Boolean).join(' ')}
            role="button"
            tabIndex={0}
            onClick={() => {
              void toggleAllMicrophone();
            }}
          >
            {microphoneControl.label}
          </div>
          <div
            className={['participant-list-mobile-footer-btn', cameraControl.active ? 'is-on' : ''].filter(Boolean).join(' ')}
            role="button"
            tabIndex={0}
            onClick={() => {
              void toggleAllCamera();
            }}
          >
            {cameraControl.label}
          </div>
          <div className="participant-list-mobile-footer-btn" role="button" tabIndex={0} onClick={() => setMoreSheetOpen(true)}>
            {t('Room.More')}
          </div>
        </footer>
      )}

      <ParticipantMemberSheet open={memberSheetOpen} userId={selectedUserId} onUpdateOpen={setMemberSheetOpen} />
      <ParticipantActionSheet
        open={moreSheetOpen}
        groups={[[screenShareControl]]}
        split
        onUpdateOpen={setMoreSheetOpen}
        onSelect={() => {
          void toggleAllScreenShare();
        }}
      />

      <UserPickerMobile
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

export default ParticipantListMobile;
