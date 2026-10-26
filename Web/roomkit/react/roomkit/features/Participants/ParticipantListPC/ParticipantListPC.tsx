import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  DeviceStatus,
  DeviceType,
  RoomParticipantRole,
} from 'tuikit-atomicx-react/room';
import { TUIButton, TUIDropdown, TUIDropdownItem, TUIInput, IconChevron, IconSearch, IconUserPlus, TUIMessageBox, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import InviteDialog from './InviteDialog';
import ParticipantRow from './ParticipantRow';
import PendingRow from './PendingRow';
import { formatNameList, participantDisplayName, useParticipantActions, useParticipantList } from './useParticipant';
import { useInvitation } from './useInvitation';
import type { ParticipantFailure } from './useParticipant';
import type { InvitationFailure } from './useInvitation';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import './ParticipantListPC.scss';

const invitationFailureKey: Record<InvitationFailure, string> = {
  'no-room': 'Participants.InviteFailure.no-room',
  'empty': 'Participants.CallAllEmpty',
  'failed': 'Participants.InviteFailure.failed',
};

function sectionContentHeight(section: HTMLElement | null): number {
  if (!section) {
    return 0;
  }
  const heading = section.querySelector('.participant-panel-heading');
  const rows = section.querySelector('.participant-panel-rows');
  const styles = getComputedStyle(section);
  return Number.parseFloat(styles.paddingTop)
    + Number.parseFloat(styles.borderTopWidth)
    + (heading instanceof HTMLElement ? heading.offsetHeight : 0)
    + (rows instanceof HTMLElement ? rows.scrollHeight : 0);
}

export interface ParticipantListPCProps {
  className?: string;
  style?: CSSProperties;
}

export function ParticipantListPC(props: ParticipantListPCProps) {
  const { className, style } = props;
  const { t } = useI18n();

  const [query, setQuery] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [joinedCollapsed, setJoinedCollapsed] = useState(false);
  const [pendingCollapsed, setPendingCollapsed] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const joinedSectionRef = useRef<HTMLElement | null>(null);
  const pendingSectionRef = useRef<HTMLElement | null>(null);
  const [joinedTall, setJoinedTall] = useState(false);
  const [pendingTall, setPendingTall] = useState(false);

  const {
    canManageMembers,
    isAllMicrophoneDisabled,
    isAllCameraDisabled,
    isAllScreenShareDisabled,
    setAllDevicesDisabled,
  } = useParticipantActions();
  const { joinedParticipants, pendingParticipants, refreshParticipants } = useParticipantList();
  const { idlePending, callAllPending } = useInvitation();

  const isJoinedFill = joinedTall;
  const isPendingFill = pendingTall;
  const isBothTall = joinedTall && pendingTall;

  function syncSectionFlex() {
    const body = bodyRef.current;
    if (!body) {
      return;
    }
    // A group is "tall" when its natural content would exceed half the body.
    const cap = body.clientHeight / 2;
    setJoinedTall(sectionContentHeight(joinedSectionRef.current) > cap);
    setPendingTall(sectionContentHeight(pendingSectionRef.current) > cap);
  }

  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  function observeSections() {
    const resizeObserver = resizeObserverRef.current;
    resizeObserver?.disconnect();
    if (!resizeObserver) {
      return;
    }
    if (bodyRef.current) {
      resizeObserver.observe(bodyRef.current);
    }
    if (joinedSectionRef.current) {
      resizeObserver.observe(joinedSectionRef.current);
    }
    if (pendingSectionRef.current) {
      resizeObserver.observe(pendingSectionRef.current);
    }
    syncSectionFlex();
  }

  useEffect(() => {
    void refreshParticipants();
    resizeObserverRef.current = new ResizeObserver(() => {
      syncSectionFlex();
    });
    observeSections();
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function matchesQuery(participant: RoomParticipant): boolean {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return true;
    }
    const name = participantDisplayName(participant).toLowerCase();
    return name.includes(keyword) || participant.userId.toLowerCase().includes(keyword);
  }

  const visibleJoined = useMemo(
    () => joinedParticipants.filter(matchesQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [joinedParticipants, query],
  );
  const visiblePending = useMemo(
    () => pendingParticipants.filter(matchesQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingParticipants, query],
  );
  const showPending = pendingParticipants.length > 0;

  // The pending section mounts and unmounts with `showPending`, which swaps the observed element.
  const isFirstSectionRun = useRef(true);
  useLayoutEffect(() => {
    if (isFirstSectionRun.current) {
      isFirstSectionRun.current = false;
      return;
    }
    observeSections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPending]);

  const isFirstFlexRun = useRef(true);
  useLayoutEffect(() => {
    if (isFirstFlexRun.current) {
      isFirstFlexRun.current = false;
      return;
    }
    syncSectionFlex();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleJoined, visiblePending, joinedCollapsed, pendingCollapsed, showPending]);

  function notifyParticipant(failure?: ParticipantFailure) {
    if (!failure) {
      return false;
    }
    TUIToast[failure === 'failed' ? 'error' : 'warning'](t(`Participants.ActionFailure.${failure}`));
    return true;
  }

  function notifyInvitation(failure?: InvitationFailure) {
    if (!failure) {
      return false;
    }
    TUIToast[failure === 'failed' ? 'error' : 'warning'](t(invitationFailureKey[failure]));
    return true;
  }

  async function callAll() {
    const name = formatNameList(idlePending.map(participantDisplayName));
    if (notifyInvitation(await callAllPending())) {
      return;
    }
    TUIToast.success(t('Participants.CallAllStarted', { name }));
  }

  async function toggleAllMic() {
    const disable = !isAllMicrophoneDisabled;
    if (notifyParticipant(await setAllDevicesDisabled(DeviceType.Microphone, disable))) {
      return;
    }
    TUIToast.success(t(disable ? 'Participants.MuteAllDone' : 'Participants.UnmuteAllDone'));
  }

  async function toggleAllCam() {
    const disable = !isAllCameraDisabled;
    if (notifyParticipant(await setAllDevicesDisabled(DeviceType.Camera, disable))) {
      return;
    }
    TUIToast.success(t(disable ? 'Participants.CamOffAllDone' : 'Participants.CamOnAllDone'));
  }

  async function toggleAllShare() {
    const disable = !isAllScreenShareDisabled;
    if (disable) {
      const generalSharing = joinedParticipants.some(participant =>
        participant.screenShareStatus === DeviceStatus.On
        && participant.role === RoomParticipantRole.GeneralUser,
      );
      if (generalSharing) {
        const confirmed = await TUIMessageBox.confirm({
          title: t('Participants.ShareOwnerOnlyTitle'),
          message: t('Participants.ShareOwnerOnlyMessage'),
          confirmText: t('Participants.Confirm'),
          cancelText: t('Participants.Cancel'),
        });
        if (!confirmed) {
          return;
        }
      }
    }
    if (notifyParticipant(await setAllDevicesDisabled(DeviceType.ScreenShare, disable))) {
      return;
    }
    TUIToast.success(t(disable ? 'Participants.ShareOwnerOnlyDone' : 'Participants.ShareEveryoneDone'));
  }

  async function handleMore(command: string | number) {
    if (command === 'share') {
      await toggleAllShare();
    }
  }

  return (
    <div className={['participant-panel', className ?? ''].filter(Boolean).join(' ')} style={style}>
      <div className="participant-panel-toolbar">
        <TUIInput
          modelValue={query}
          onUpdateModelValue={value => setQuery(String(value ?? ''))}
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
          onClick={() => setInviteOpen(true)}
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
          className={['participant-panel-section', isJoinedFill ? 'is-fill' : ''].filter(Boolean).join(' ')}
        >
          <header className="participant-panel-heading">
            <button
              className="participant-panel-toggle"
              type="button"
              aria-expanded={!joinedCollapsed}
              title={joinedCollapsed ? t('Participants.Expand') : t('Participants.Collapse')}
              onClick={() => setJoinedCollapsed(!joinedCollapsed)}
            >
              <IconChevron size={12} className={joinedCollapsed ? 'is-collapsed' : undefined} />
              <span className="participant-panel-title">{t('Participants.Joined')}</span>
              <span className="participant-panel-count">{joinedParticipants.length}</span>
            </button>
          </header>
          {!joinedCollapsed && (
            <div className="participant-panel-rows">
              {visibleJoined.length === 0 && (
                <div className="participant-panel-empty">
                  {t('Participants.Empty')}
                </div>
              )}
              {visibleJoined.map(participant => (
                <ParticipantRow
                  key={participant.userId}
                  participant={participant}
                />
              ))}
            </div>
          )}
        </section>

        {showPending && (
          <section
            ref={pendingSectionRef}
            className={['participant-panel-section', isPendingFill ? 'is-fill' : ''].filter(Boolean).join(' ')}
          >
            <header className="participant-panel-heading">
              <button
                className="participant-panel-toggle"
                type="button"
                aria-expanded={!pendingCollapsed}
                title={pendingCollapsed ? t('Participants.Expand') : t('Participants.Collapse')}
                onClick={() => setPendingCollapsed(!pendingCollapsed)}
              >
                <IconChevron size={12} className={pendingCollapsed ? 'is-collapsed' : undefined} />
                <span className="participant-panel-title">{t('Participants.Pending')}</span>
                <span className="participant-panel-count">{pendingParticipants.length}</span>
              </button>
              <button
                className="participant-panel-call-all"
                type="button"
                disabled={idlePending.length === 0}
                title={t('Participants.CallAllTip')}
                onClick={(event) => {
                  event.stopPropagation();
                  void callAll();
                }}
              >
                {t('Participants.CallAll')}
              </button>
            </header>
            {!pendingCollapsed && (
              <div className="participant-panel-rows">
                {visiblePending.length === 0 && (
                  <div className="participant-panel-empty">
                    {t('Participants.Empty')}
                  </div>
                )}
                {visiblePending.map(participant => (
                  <PendingRow
                    key={participant.userId}
                    participant={participant}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {canManageMembers && (
        <footer className="participant-panel-footer">
          <button
            className={['participant-panel-footer-btn', isAllMicrophoneDisabled ? 'is-on' : ''].filter(Boolean).join(' ')}
            type="button"
            onClick={() => {
              void toggleAllMic();
            }}
          >
            {isAllMicrophoneDisabled ? t('Participants.UnmuteAll') : t('Participants.MuteAll')}
          </button>
          <button
            className={['participant-panel-footer-btn', isAllCameraDisabled ? 'is-on' : ''].filter(Boolean).join(' ')}
            type="button"
            onClick={() => {
              void toggleAllCam();
            }}
          >
            {isAllCameraDisabled ? t('Participants.CamOnAll') : t('Participants.CamOffAll')}
          </button>
          <TUIDropdown
            trigger="click"
            placement="top-end"
            onUpdateOpen={setMoreOpen}
            onCommand={(command) => {
              void handleMore(command);
            }}
            menuSlot={(
              <div className="participant-panel-menu">
                <TUIDropdownItem
                  command="share"
                  className={isAllScreenShareDisabled ? 'is-on' : undefined}
                >
                  {isAllScreenShareDisabled ? t('Participants.ShareEveryone') : t('Participants.ShareOwnerOnly')}
                </TUIDropdownItem>
              </div>
            )}
          >
            <button
              className={['participant-panel-footer-btn', moreOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
              type="button"
            >
              {t('Participants.More')}
            </button>
          </TUIDropdown>
        </footer>
      )}

      <InviteDialog open={inviteOpen} onUpdateOpen={setInviteOpen} />
    </div>
  );
}

export default ParticipantListPC;
