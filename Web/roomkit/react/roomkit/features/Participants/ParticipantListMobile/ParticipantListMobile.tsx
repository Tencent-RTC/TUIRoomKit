import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import {
  DeviceStatus,
  DeviceType,
  RoomCallResult,
  RoomEvent,
  RoomParticipantRole,
  RoomParticipantStatus,
  useDeviceState,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import type { RoomCall, RoomInfo, RoomParticipant } from 'tuikit-atomicx-react/room';
import {
  IconCam,
  IconCamOff,
  IconChat,
  IconChatOff,
  IconChevron,
  IconKick,
  IconMic,
  IconMicOff,
  IconPhone,
  IconRename,
  IconRevokeAdmin,
  IconSearch,
  IconSetAdmin,
  IconShare,
  IconTransferOwner,
  IconUserPlus,
  TUIAvatar,
  TUIDialog,
  TUIInput,
  TUIMessageBox,
  TUIToast,
} from '../../../base';
import { useI18n } from '../../../i18n';
import UserPickerMobile from '../UserPickerMobile/UserPickerMobile';
import type { PickedContactMobile } from '../UserPickerMobile/UserPickerMobile';
import ParticipantActionSheet from './ParticipantActionSheet';
import type { ParticipantActionItem } from './ParticipantActionSheet';
import './ParticipantListMobile.scss';

/** The TUIErrorCode re-exported by atomicx has no admin-limit member, so the engine code is used directly. */
const ERROR_CODE_ADMIN_COUNT_LIMIT = 100020;
const CALL_TIMEOUT_SECONDS = 60;
const CALL_FAILED_HOLD_MS = 2000;

export interface ParticipantListMobileProps {
  className?: string;
  style?: CSSProperties;
}

export function ParticipantListMobile(props: ParticipantListMobileProps) {
  const { className, style } = props;
  const { t } = useI18n();

  // `currentRoom` is a live getter, so callbacks read it through the state object after awaits.
  const roomState = useRoomState();
  const { currentRoom, callUserToRoom, subscribeEvent, unsubscribeEvent } = roomState;
  const { loginUserInfo } = useLoginState();
  const {
    participantList,
    pendingParticipantList,
    localParticipant,
    getParticipantList,
    kickUser,
    setAdmin,
    revokeAdmin,
    transferOwner,
    closeParticipantDevice,
    inviteToOpenDevice,
    disableUserMessage,
    disableAllDevices,
    updateParticipantNameCard,
    unmuteMicrophone,
  } = useRoomParticipantState();
  const { openLocalMicrophone, closeLocalMicrophone, openLocalCamera, closeLocalCamera } = useDeviceState();

  const [query, setQuery] = useState('');
  const [joinedOpen, setJoinedOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [hostSheetOpen, setHostSheetOpen] = useState(false);
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [failedCallIds, setFailedCallIds] = useState<Set<string>>(() => new Set());
  const isBusyRef = useRef(false);

  const localUserId = loginUserInfo?.userId || '';
  const roomId = currentRoom?.roomId;
  const isRoomOwner = Boolean(localUserId) && currentRoom?.roomOwner?.userId === localUserId;
  const canManageMembers = isRoomOwner || localParticipant?.role === RoomParticipantRole.Admin;
  const isAllMicrophoneDisabled = Boolean(currentRoom?.isAllMicrophoneDisabled);
  const isAllCameraDisabled = Boolean(currentRoom?.isAllCameraDisabled);
  const isAllScreenShareDisabled = Boolean(currentRoom?.isAllScreenShareDisabled);

  function displayName(participant: RoomParticipant): string {
    return (participant.nameCard || participant.userName || participant.userId).trim();
  }

  function isLocal(participant: RoomParticipant): boolean {
    return Boolean(localUserId) && participant.userId === localUserId;
  }

  function canManage(participant: RoomParticipant): boolean {
    if (isLocal(participant) || !canManageMembers) {
      return false;
    }
    if (isRoomOwner) {
      return participant.role !== RoomParticipantRole.Owner;
    }
    return participant.role === RoomParticipantRole.GeneralUser;
  }

  function matchesQuery(participant: RoomParticipant): boolean {
    const keyword = query.trim().toLowerCase();
    return !keyword || displayName(participant).toLowerCase().includes(keyword);
  }

  /** Sharer first, then owner, self, admin; general members order by live media. */
  function rank(participant: RoomParticipant): number[] {
    const micOn = participant.microphoneStatus === DeviceStatus.On;
    const camOn = participant.cameraStatus === DeviceStatus.On;
    let role = 3;
    if (participant.screenShareStatus === DeviceStatus.On) {
      role = -1;
    } else if (participant.role === RoomParticipantRole.Owner) {
      role = 0;
    } else if (isLocal(participant)) {
      role = 1;
    } else if (participant.role === RoomParticipantRole.Admin) {
      role = 2;
    }
    let media = 3;
    if (micOn && camOn) {
      media = 0;
    } else if (camOn) {
      media = 1;
    } else if (micOn) {
      media = 2;
    }
    return [role, role === 3 ? media : 0];
  }

  const visibleJoined = useMemo(() => participantList
    .filter(matchesQuery)
    .map(participant => ({ participant, order: rank(participant) }))
    .sort((a, b) => (a.order[0] - b.order[0]) || (a.order[1] - b.order[1])
      || displayName(a.participant).localeCompare(displayName(b.participant)))
    .map(item => item.participant),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [participantList, query, localUserId]);

  const visiblePending = useMemo(() => (
    roomId ? pendingParticipantList.filter(matchesQuery) : []
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [roomId, pendingParticipantList, query]);

  const idlePendingIds = useMemo(() => visiblePending
    .filter(item => item.roomStatus !== RoomParticipantStatus.InCalling && !failedCallIds.has(item.userId))
    .map(item => item.userId),
  [visiblePending, failedCallIds]);

  const isSearchEmpty = Boolean(query.trim()) && visibleJoined.length === 0 && visiblePending.length === 0;

  const searchEmptyDesc = useMemo(() => {
    const marker = '\u0000';
    const [before = '', after = ''] = t('Participants.SearchEmptyDesc', { query: marker }).split(marker);
    return [before, after];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const occupiedIds = useMemo(() => [
    ...participantList.map(item => item.userId),
    ...pendingParticipantList
      .filter(item => item.roomStatus === RoomParticipantStatus.InCalling)
      .map(item => item.userId),
  ], [participantList, pendingParticipantList]);

  const target = useMemo(
    () => participantList.find(item => item.userId === targetUserId) ?? null,
    [participantList, targetUserId],
  );

  function memberGroupsFor(participant: RoomParticipant): ParticipantActionItem[][] {
    const micOn = participant.microphoneStatus === DeviceStatus.On;
    const camOn = participant.cameraStatus === DeviceStatus.On;
    if (isLocal(participant)) {
      return [[
        { key: 'local-mic', label: t(micOn ? 'Participants.MicClose' : 'Participants.MicOpen'), icon: micOn ? IconMic : IconMicOff },
        { key: 'local-cam', label: t(camOn ? 'Participants.CamClose' : 'Participants.CamOpen'), icon: camOn ? IconCam : IconCamOff },
        { key: 'rename', label: t('Participants.Rename'), icon: IconRename },
      ]];
    }
    const manageable = canManage(participant);
    const identity: ParticipantActionItem[] = [];
    if (manageable) {
      identity.push({ key: 'rename', label: t('Participants.Rename'), icon: IconRename });
    }
    if (isRoomOwner) {
      identity.push({ key: 'transfer', label: t('Participants.TransferOwner'), icon: IconTransferOwner });
      if (participant.role === RoomParticipantRole.GeneralUser) {
        identity.push({ key: 'set-admin', label: t('Participants.SetAdmin'), icon: IconSetAdmin });
      } else if (participant.role === RoomParticipantRole.Admin) {
        identity.push({ key: 'revoke-admin', label: t('Participants.RevokeAdmin'), icon: IconRevokeAdmin });
      }
    }
    if (!manageable) {
      return identity.length ? [identity] : [];
    }
    const media: ParticipantActionItem[] = [
      { key: micOn ? 'mic-close' : 'mic-invite', label: t(micOn ? 'Participants.AudioDisable' : 'Participants.AudioAllow'), icon: micOn ? IconMic : IconMicOff },
      { key: camOn ? 'cam-close' : 'cam-invite', label: t(camOn ? 'Participants.VideoDisable' : 'Participants.VideoAllow'), icon: camOn ? IconCam : IconCamOff },
      {
        key: 'chat',
        label: t(participant.isMessageDisabled ? 'Participants.ChatUnmute' : 'Participants.ChatMute'),
        icon: participant.isMessageDisabled ? IconChatOff : IconChat,
      },
    ];
    const danger: ParticipantActionItem[] = [{ key: 'kick', label: t('Participants.Kick'), icon: IconKick, danger: true }];
    return [identity, media, danger].filter(group => group.length > 0);
  }

  function hasActions(participant: RoomParticipant): boolean {
    return memberGroupsFor(participant).length > 0;
  }

  const memberGroups = useMemo(
    () => (target ? memberGroupsFor(target) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [target, canManageMembers, isRoomOwner],
  );
  const memberGroupsEmpty = memberGroups.length === 0;

  const hostGroups = useMemo<ParticipantActionItem[][]>(() => [[
    {
      key: 'share-all',
      label: t(isAllScreenShareDisabled ? 'Participants.ShareEveryone' : 'Participants.ShareOwnerOnly'),
      active: isAllScreenShareDisabled,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ]], [isAllScreenShareDisabled, t]);

  // The sheet's target can leave the room or lose its last action while the sheet is open.
  useEffect(() => {
    if (memberSheetOpen && memberGroupsEmpty) {
      setMemberSheetOpen(false);
    }
  }, [memberSheetOpen, memberGroupsEmpty]);

  function openMemberSheet(participant: RoomParticipant) {
    if (!hasActions(participant)) {
      return;
    }
    setTargetUserId(participant.userId);
    setMemberSheetOpen(true);
  }

  /** Runs one engine call at a time; returns the error so callers can pick the failure copy. */
  async function run(action: () => Promise<unknown>): Promise<{ ok: boolean; error?: unknown }> {
    if (isBusyRef.current) {
      return { ok: false };
    }
    isBusyRef.current = true;
    try {
      await action();
      return { ok: true };
    } catch (error) {
      console.error('[RoomKit.participant] action failed:', error);
      return { ok: false, error };
    } finally {
      isBusyRef.current = false;
    }
  }

  function canOpenDespitePolicy(): boolean {
    const role = localParticipant?.role;
    return role === RoomParticipantRole.Owner || role === RoomParticipantRole.Admin;
  }

  async function runMemberAction(key: string) {
    const participant = target;
    setMemberSheetOpen(false);
    if (!participant) {
      return;
    }
    const name = displayName(participant);
    const { userId } = participant;

    if (key === 'rename') {
      setRenameValue(name);
      setRenameOpen(true);
      return;
    }
    if (key === 'local-mic') {
      const open = participant.microphoneStatus !== DeviceStatus.On;
      if (open && isAllMicrophoneDisabled && !canOpenDespitePolicy()) {
        TUIToast.warning(t('Device.AllMicDisabled'));
        return;
      }
      const result = await run(async () => {
        if (!open) {
          await closeLocalMicrophone();
          return;
        }
        await openLocalMicrophone();
        await unmuteMicrophone();
      });
      if (result.ok) {
        TUIToast.success(t(open ? 'Participants.MicOpened' : 'Participants.MicClosed'));
      } else if (result.error) {
        TUIToast.error(t('Participants.ActionFailure.failed'));
      }
      return;
    }
    if (key === 'local-cam') {
      const open = participant.cameraStatus !== DeviceStatus.On;
      if (open && isAllCameraDisabled && !canOpenDespitePolicy()) {
        TUIToast.warning(t('Device.AllCamDisabled'));
        return;
      }
      const result = await run(() => (open ? openLocalCamera() : closeLocalCamera()));
      if (result.ok) {
        TUIToast.success(t(open ? 'Participants.CamOpened' : 'Participants.CamClosed'));
      } else if (result.error) {
        TUIToast.error(t('Participants.ActionFailure.failed'));
      }
      return;
    }
    if (key === 'transfer') {
      const confirmed = await TUIMessageBox.confirm({
        title: t('Participants.TransferOwner'),
        message: t('Participants.TransferOwnerMessage', { name }),
        confirmText: t('Participants.TransferOwnerConfirm'),
        cancelText: t('Participants.Cancel'),
      });
      if (!confirmed) {
        return;
      }
      const result = await run(() => transferOwner({ userId }));
      if (result.ok) {
        TUIToast.success(t('Participants.TransferOwnerDone', { name }));
      } else if (result.error) {
        TUIToast.error(t('Participants.ActionFailure.failed'));
      }
      return;
    }
    if (key === 'kick') {
      const confirmed = await TUIMessageBox.danger({
        title: t('Participants.Kick'),
        message: t('Participants.KickMessage', { name }),
        confirmText: t('Participants.KickConfirm'),
        cancelText: t('Participants.Cancel'),
      });
      if (!confirmed) {
        return;
      }
      const result = await run(() => kickUser({ userId }));
      if (result.ok) {
        TUIToast.success(t('Participants.KickDone', { name }));
      } else if (result.error) {
        TUIToast.error(t('Participants.ActionFailure.failed'));
      }
      return;
    }
    if (key === 'set-admin' || key === 'revoke-admin') {
      const result = await run(() => (key === 'set-admin' ? setAdmin({ userId }) : revokeAdmin({ userId })));
      if (result.ok) {
        TUIToast.success(t(key === 'set-admin' ? 'Participants.SetAdminDone' : 'Participants.RevokeAdminDone', { name }));
      } else if ((result.error as { code?: number } | undefined)?.code === ERROR_CODE_ADMIN_COUNT_LIMIT) {
        TUIToast.warning(t('Participants.ActionFailure.admin-limit'));
      } else if (result.error) {
        TUIToast.error(t('Participants.ActionFailure.failed'));
      }
      return;
    }
    if (key === 'chat') {
      const disable = !participant.isMessageDisabled;
      const result = await run(() => disableUserMessage({ userId, disable }));
      if (result.ok) {
        TUIToast.success(t(disable ? 'Participants.ChatMuted' : 'Participants.ChatUnmuted', { name }));
      } else if (result.error) {
        TUIToast.error(t('Participants.ActionFailure.failed'));
      }
      return;
    }
    const device = key.startsWith('mic') ? DeviceType.Microphone : DeviceType.Camera;
    const close = key.endsWith('close');
    const result = await run(() => (close
      ? closeParticipantDevice({ userId, deviceType: device })
      : inviteToOpenDevice({ userId, device, timeout: 30 })));
    if (result.ok) {
      const doneKeys = device === DeviceType.Microphone
        ? ['Participants.MuteDone', 'Participants.UnmuteRequested']
        : ['Participants.CamStopDone', 'Participants.CamRequested'];
      TUIToast.success(t(doneKeys[close ? 0 : 1], { name }));
    } else if (result.error) {
      TUIToast.error(t('Participants.ActionFailure.failed'));
    }
  }

  async function submitRename() {
    const participant = target;
    const nameCard = renameValue.trim();
    if (!participant || !nameCard) {
      return;
    }
    const result = await run(() => updateParticipantNameCard({ userId: participant.userId, nameCard }));
    if (result.ok) {
      setRenameOpen(false);
      TUIToast.success(t('Participants.RenameDone'));
    } else if (result.error) {
      TUIToast.error(t('Participants.ActionFailure.failed'));
    }
  }

  async function toggleAllDevice(deviceType: DeviceType.Microphone | DeviceType.Camera) {
    const isMic = deviceType === DeviceType.Microphone;
    const disable = !(isMic ? isAllMicrophoneDisabled : isAllCameraDisabled);
    const result = await run(() => disableAllDevices({ deviceType, disable }));
    if (result.ok) {
      const doneKeys = isMic
        ? ['Participants.MuteAllDone', 'Participants.UnmuteAllDone']
        : ['Participants.CamOffAllDone', 'Participants.CamOnAllDone'];
      TUIToast.success(t(doneKeys[disable ? 0 : 1]));
    } else if (result.error) {
      TUIToast.error(t('Participants.ActionFailure.failed'));
    }
  }

  async function runHostAction(key: string) {
    if (key !== 'share-all') {
      return;
    }
    const disable = !isAllScreenShareDisabled;
    const generalSharing = participantList.some(participant => (
      participant.screenShareStatus === DeviceStatus.On && participant.role === RoomParticipantRole.GeneralUser
    ));
    if (disable && generalSharing) {
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
    const result = await run(() => disableAllDevices({ deviceType: DeviceType.ScreenShare, disable }));
    if (result.ok) {
      TUIToast.success(t(disable ? 'Participants.ShareOwnerOnlyDone' : 'Participants.ShareEveryoneDone'));
    } else if (result.error) {
      TUIToast.error(t('Participants.ActionFailure.failed'));
    }
  }

  const failTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  function markCallFailed(userId: string) {
    clearTimeout(failTimersRef.current.get(userId));
    setFailedCallIds(prev => new Set(prev).add(userId));
    failTimersRef.current.set(userId, setTimeout(() => {
      failTimersRef.current.delete(userId);
      setFailedCallIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }, CALL_FAILED_HOLD_MS));
  }

  function nameList(names: string[]): string {
    const shown = names.slice(0, 3).join(t('Participants.NameSeparator'));
    return names.length > 3 ? t('Participants.NameOverflow', { names: shown, count: names.length }) : shown;
  }

  async function callUsers(users: Array<{ userId: string; name: string }> | RoomParticipant[]): Promise<boolean> {
    const currentRoomId = roomState.currentRoom?.roomId;
    if (!currentRoomId) {
      TUIToast.warning(t('Participants.InviteFailure.no-room'));
      return false;
    }
    const list = users.map(user => ({
      userId: user.userId,
      name: 'name' in user ? user.name : displayName(user),
    }));
    if (list.length === 0) {
      TUIToast.warning(t('Participants.CallAllEmpty'));
      return false;
    }
    let results: Map<string, RoomCallResult> | undefined;
    const result = await run(async () => {
      results = await callUserToRoom({ roomId: currentRoomId, userIdList: list.map(item => item.userId), timeout: CALL_TIMEOUT_SECONDS });
    });
    if (!result.ok) {
      if (result.error) {
        TUIToast.error(t('Participants.InviteFailure.failed'));
      }
      return false;
    }
    results?.forEach((callResult, userId) => {
      if (callResult === RoomCallResult.AlreadyInCalling) {
        markCallFailed(userId);
      }
    });
    TUIToast.success(t('Participants.CallStarted', { name: nameList(list.map(item => item.name)) }));
    return true;
  }

  function callAll() {
    const ids = new Set(idlePendingIds);
    void callUsers(visiblePending.filter(item => ids.has(item.userId)));
  }

  async function inviteContacts(contacts: PickedContactMobile[]) {
    const occupied = new Set(occupiedIds);
    const fresh = contacts.filter(contact => !occupied.has(contact.userId));
    if (await callUsers(fresh.map(contact => ({ userId: contact.userId, name: contact.userName })))) {
      setInviteOpen(false);
    }
  }

  function onEnterKeyDown(event: KeyboardEvent<HTMLDivElement>, action: () => void) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    action();
  }

  function renderWaitState(participant: RoomParticipant) {
    if (failedCallIds.has(participant.userId)) {
      return (
        <span className="participant-list-mobile-wait-failed">
          {t('Participants.NoAnswer')}
        </span>
      );
    }
    if (participant.roomStatus === RoomParticipantStatus.InCalling) {
      return (
        <span className="participant-list-mobile-wait-call is-calling">
          <IconPhone className="participant-list-mobile-wait-pulse" size={14} />
          <span>{t('Participants.Calling')}</span>
        </span>
      );
    }
    return (
      <div
        className="participant-list-mobile-wait-call"
        role="button"
        tabIndex={0}
        aria-label={t('Participants.Call')}
        onClick={() => {
          void callUsers([participant]);
        }}
      >
        <IconPhone size={14} />
      </div>
    );
  }

  useEffect(() => {
    function onCallFailed({ roomInfo, call }: { roomInfo: RoomInfo; call: RoomCall }) {
      if (roomInfo.roomId === roomState.currentRoom?.roomId && call.caller.userId === localUserId) {
        markCallFailed(call.callee.userId);
      }
    }
    subscribeEvent(RoomEvent.onCallRejected, onCallFailed);
    subscribeEvent(RoomEvent.onCallTimeout, onCallFailed);
    if (roomState.currentRoom?.roomId) {
      getParticipantList({ cursor: '' }).catch((error: unknown) => {
        console.error('[RoomKit.participant] Failed to load participants:', error);
      });
    }
    return () => {
      unsubscribeEvent(RoomEvent.onCallRejected, onCallFailed);
      unsubscribeEvent(RoomEvent.onCallTimeout, onCallFailed);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, localUserId]);

  useEffect(() => () => {
    failTimersRef.current.forEach(timer => clearTimeout(timer));
    failTimersRef.current.clear();
  }, []);

  const showPendingSection = query.trim() ? visiblePending.length > 0 : true;

  return (
    <div className={['participant-list-mobile', className ?? ''].filter(Boolean).join(' ')} style={style}>
      <div className="participant-list-mobile-body">
        <div className="participant-list-mobile-toolbar">
          <TUIInput
            modelValue={query}
            onUpdateModelValue={value => setQuery(String(value ?? ''))}
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
            onClick={() => setInviteOpen(true)}
            onKeyDown={event => onEnterKeyDown(event, () => setInviteOpen(true))}
          >
            <IconUserPlus size={16} />
          </div>
        </div>

        {isSearchEmpty && (
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
              {searchEmptyDesc[0]}
              <mark>{query.trim()}</mark>
              {searchEmptyDesc[1]}
            </div>
            <div className="participant-list-mobile-empty-actions">
              <div
                className="participant-list-mobile-empty-btn"
                role="button"
                tabIndex={0}
                onClick={() => setQuery('')}
                onKeyDown={event => onEnterKeyDown(event, () => setQuery(''))}
              >
                {t('Participants.ClearSearch')}
              </div>
              <div
                className="participant-list-mobile-empty-btn is-primary"
                role="button"
                tabIndex={0}
                onClick={() => setInviteOpen(true)}
                onKeyDown={event => onEnterKeyDown(event, () => setInviteOpen(true))}
              >
                {t('Participants.Invite')}
              </div>
            </div>
          </div>
        )}
        {!isSearchEmpty && (
          <>
            <section className="participant-list-mobile-section">
              <div className="participant-list-mobile-section-bar">
                <div
                  className="participant-list-mobile-section-toggle"
                  role="button"
                  tabIndex={0}
                  aria-expanded={joinedOpen}
                  onClick={() => setJoinedOpen(!joinedOpen)}
                  onKeyDown={event => onEnterKeyDown(event, () => setJoinedOpen(!joinedOpen))}
                >
                  <IconChevron className={['participant-list-mobile-section-chev', !joinedOpen ? 'is-collapsed' : ''].filter(Boolean).join(' ')} size={12} />
                  <span>{t('Participants.Joined')}</span>
                  <span className="participant-list-mobile-section-count">{visibleJoined.length}</span>
                </div>
              </div>
              {joinedOpen && (
                <div className="participant-list-mobile-section-body">
                  {visibleJoined.map(participant => (
                    <div
                      key={participant.userId}
                      className={['participant-list-mobile-row', hasActions(participant) ? 'is-tappable' : ''].filter(Boolean).join(' ')}
                      role={hasActions(participant) ? 'button' : undefined}
                      tabIndex={hasActions(participant) ? 0 : undefined}
                      onClick={() => openMemberSheet(participant)}
                    >
                      <TUIAvatar size={32} src={participant.avatarUrl} alt={displayName(participant)} />
                      <div className="participant-list-mobile-info">
                        <div className="participant-list-mobile-name">
                          <span className="participant-list-mobile-name-text">{displayName(participant)}</span>
                          {isLocal(participant) && <span className="participant-list-mobile-tag is-self">{t('Participants.Me')}</span>}
                          {participant.role === RoomParticipantRole.Owner && (
                            <span className="participant-list-mobile-tag is-owner">
                              {t('Participants.Owner')}
                            </span>
                          )}
                          {participant.role !== RoomParticipantRole.Owner && participant.role === RoomParticipantRole.Admin && (
                            <span className="participant-list-mobile-tag is-admin">
                              {t('Participants.Admin')}
                            </span>
                          )}
                          {participant.screenShareStatus === DeviceStatus.On && (
                            <span className="participant-list-mobile-tag is-sharing">
                              <IconShare size={10} />
                              {t('Participants.Sharing')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="participant-list-mobile-icons">
                        <span className="participant-list-mobile-status">
                          {participant.microphoneStatus === DeviceStatus.On ? <IconMic size={14} /> : <IconMicOff size={14} />}
                        </span>
                        <span className="participant-list-mobile-status">
                          {participant.cameraStatus === DeviceStatus.On ? <IconCam size={14} /> : <IconCamOff size={14} />}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {showPendingSection && (
              <section className="participant-list-mobile-section">
                <div className="participant-list-mobile-section-bar">
                  <div
                    className="participant-list-mobile-section-toggle"
                    role="button"
                    tabIndex={0}
                    aria-expanded={pendingOpen}
                    onClick={() => setPendingOpen(!pendingOpen)}
                    onKeyDown={event => onEnterKeyDown(event, () => setPendingOpen(!pendingOpen))}
                  >
                    <IconChevron className={['participant-list-mobile-section-chev', !pendingOpen ? 'is-collapsed' : ''].filter(Boolean).join(' ')} size={12} />
                    <span>{t('Participants.Pending')}</span>
                    <span className="participant-list-mobile-section-count">{visiblePending.length}</span>
                  </div>
                  {visiblePending.length > 0 && (
                    <div
                      className={['participant-list-mobile-call-all', idlePendingIds.length === 0 ? 'is-disabled' : ''].filter(Boolean).join(' ')}
                      role="button"
                      tabIndex={0}
                      onClick={callAll}
                      onKeyDown={event => onEnterKeyDown(event, callAll)}
                    >
                      {t('Participants.CallAll')}
                    </div>
                  )}
                </div>
                {pendingOpen && (
                  <div className="participant-list-mobile-section-body">
                    {visiblePending.length === 0 && (
                      <div className="participant-list-mobile-section-empty">
                        {t('Participants.WaitingEmpty')}
                      </div>
                    )}
                    {visiblePending.map(participant => (
                      <div
                        key={participant.userId}
                        className="participant-list-mobile-row"
                      >
                        <TUIAvatar size={32} src={participant.avatarUrl} alt={displayName(participant)} />
                        <div className="participant-list-mobile-info">
                          <div className="participant-list-mobile-name">
                            <span className="participant-list-mobile-name-text">{displayName(participant)}</span>
                          </div>
                        </div>
                        <div className="participant-list-mobile-wait">
                          {renderWaitState(participant)}
                        </div>
                      </div>
                    ))}
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
            className={['participant-list-mobile-footer-btn', isAllMicrophoneDisabled ? 'is-on' : ''].filter(Boolean).join(' ')}
            role="button"
            tabIndex={0}
            onClick={() => {
              void toggleAllDevice(DeviceType.Microphone);
            }}
            onKeyDown={event => onEnterKeyDown(event, () => {
              void toggleAllDevice(DeviceType.Microphone);
            })}
          >
            {isAllMicrophoneDisabled ? t('Participants.UnmuteAll') : t('Participants.MuteAll')}
          </div>
          <div
            className={['participant-list-mobile-footer-btn', isAllCameraDisabled ? 'is-on' : ''].filter(Boolean).join(' ')}
            role="button"
            tabIndex={0}
            onClick={() => {
              void toggleAllDevice(DeviceType.Camera);
            }}
            onKeyDown={event => onEnterKeyDown(event, () => {
              void toggleAllDevice(DeviceType.Camera);
            })}
          >
            {isAllCameraDisabled ? t('Participants.CamOnAll') : t('Participants.CamOffAll')}
          </div>
          <div
            className="participant-list-mobile-footer-btn"
            role="button"
            tabIndex={0}
            onClick={() => setHostSheetOpen(true)}
            onKeyDown={event => onEnterKeyDown(event, () => setHostSheetOpen(true))}
          >
            {t('Room.More')}
          </div>
        </footer>
      )}

      <ParticipantActionSheet
        open={memberSheetOpen}
        groups={memberGroups}
        onUpdateOpen={setMemberSheetOpen}
        onSelect={(key) => {
          void runMemberAction(key);
        }}
      />
      <ParticipantActionSheet
        open={hostSheetOpen}
        groups={hostGroups}
        split
        onUpdateOpen={setHostSheetOpen}
        onSelect={(key) => {
          void runHostAction(key);
        }}
      />

      <TUIDialog
        open={renameOpen}
        title={t('Participants.Rename')}
        closable={false}
        confirmText={t('Participants.Confirm')}
        cancelText={t('Participants.Cancel')}
        confirmDisabled={!renameValue.trim()}
        onUpdateOpen={setRenameOpen}
        onConfirm={() => {
          void submitRename();
        }}
      >
        <p className="participant-list-mobile-rename-desc">
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
      </TUIDialog>

      <UserPickerMobile
        open={inviteOpen}
        occupiedIds={occupiedIds}
        onUpdateOpen={setInviteOpen}
        onConfirm={(contacts) => {
          void inviteContacts(contacts);
        }}
      />
    </div>
  );
}

export default ParticipantListMobile;
