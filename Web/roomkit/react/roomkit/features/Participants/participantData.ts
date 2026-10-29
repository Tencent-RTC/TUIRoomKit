import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ComponentType } from 'react';
import {
  DeviceStatus,
  RoomEvent,
  RoomParticipantRole,
  RoomParticipantStatus,
  useDeviceState,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import {
  IconCam,
  IconCamOff,
  IconChat,
  IconChatOff,
  IconKick,
  IconMic,
  IconMicOff,
  IconRename,
  IconRevokeAdmin,
  IconSetAdmin,
  IconTransferOwner,
} from '../../base';
import type { IconProps } from '../../base';
import { t, useI18n } from '../../i18n';
import { useShareParticipants } from '../Whiteboard/WhiteboardState';
import type { RoomCall, RoomInfo, RoomParticipant } from 'tuikit-atomicx-react/room';

export type ParticipantCommand =
  | 'mic'
  | 'cam'
  | 'rename'
  | 'transfer'
  | 'set-admin'
  | 'revoke-admin'
  | 'chat'
  | 'kick';

/** Commands that share a group render together; a group change draws a separator. */
export type ParticipantCommandGroup = 'self' | 'identity' | 'media' | 'danger';

export type ParticipantRoleTag = 'owner' | 'admin' | null;

export type PendingCallState = 'idle' | 'calling' | 'no-answer';

export interface JoinedRowData {
  participant: RoomParticipant;
  userId: string;
  name: string;
  avatarUrl: string;
  isSelf: boolean;
  roleTag: ParticipantRoleTag;
  isSharing: boolean;
  isMicOn: boolean;
  isCamOn: boolean;
  canOperateMedia: boolean;
  micTooltip: string;
  camTooltip: string;
  hasMenu: boolean;
}

export interface PendingRowData {
  participant: RoomParticipant;
  userId: string;
  name: string;
  avatarUrl: string;
  callState: PendingCallState;
}

export interface ParticipantMenuItem {
  command: ParticipantCommand;
  label: string;
  icon: ComponentType<IconProps>;
  danger: boolean;
  separatorBefore: boolean;
}

/** Shape of one row in the mobile action sheet. */
export interface ParticipantSheetItem {
  key: string;
  label: string;
  icon?: ComponentType<IconProps>;
  danger?: boolean;
  active?: boolean;
}

export interface RoomControl {
  key: string;
  label: string;
  active: boolean;
}

const NAME_LIST_MAX = 3;
const NAME_LIST_BUDGET = 20;
const CALL_FAILED_HOLD_MS = 2000;

export function participantDisplayName(
  participant: Pick<RoomParticipant, 'userId' | 'userName'> & { nameCard?: string },
): string {
  return (participant.nameCard || participant.userName || participant.userId).trim();
}

export function matchesParticipantQuery(participant: RoomParticipant, query: string): boolean {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return true;
  }
  return participantDisplayName(participant).toLowerCase().includes(keyword)
    || participant.userId.toLowerCase().includes(keyword);
}

/**
 * Keeps the call toast on a single line: a few names plus a total count.
 * Names are never truncated; the first one is always shown in full and the
 * rest only join while they fit the width budget of the 420px toast.
 */
export function formatNameList(names: string[]): string {
  const shown: string[] = [];
  let used = 0;
  for (const name of names.slice(0, NAME_LIST_MAX)) {
    if (shown.length && used + name.length > NAME_LIST_BUDGET) {
      break;
    }
    shown.push(name);
    used += name.length;
  }
  const visible = shown.join(t('Participants.NameSeparator'));
  return shown.length < names.length
    ? t('Participants.NameOverflow', { names: visible, count: names.length })
    : visible;
}

/**
 * Sort priority, highest first: self, owner, admin, sharing, mic and camera on,
 * camera on, mic on, being called; ties fall back to display name.
 */
export function compareParticipants(a: RoomParticipant, b: RoomParticipant, localUserId?: string): number {
  const flags = (participant: RoomParticipant): boolean[] => [
    participant.userId === localUserId,
    participant.role === RoomParticipantRole.Owner,
    participant.role === RoomParticipantRole.Admin,
    participant.screenShareStatus === DeviceStatus.On,
    participant.cameraStatus === DeviceStatus.On && participant.microphoneStatus === DeviceStatus.On,
    participant.cameraStatus === DeviceStatus.On,
    participant.microphoneStatus === DeviceStatus.On,
    participant.roomStatus === RoomParticipantStatus.InCalling,
  ];
  const left = flags(a);
  const right = flags(b);
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] ? -1 : 1;
    }
  }
  const leftName = participantDisplayName(a);
  const rightName = participantDisplayName(b);
  if (leftName < rightName) {
    return -1;
  }
  if (rightName < leftName) {
    return 1;
  }
  return 0;
}

export interface CommandContext {
  isSelf: boolean;
  canManageTarget: boolean;
  isRoomOwner: boolean;
  role: RoomParticipantRole;
}

export function availableCommands(context: CommandContext): Array<{ command: ParticipantCommand; group: ParticipantCommandGroup }> {
  if (context.isSelf) {
    return [
      { command: 'mic', group: 'self' },
      { command: 'cam', group: 'self' },
      { command: 'rename', group: 'self' },
    ];
  }
  const commands: Array<{ command: ParticipantCommand; group: ParticipantCommandGroup }> = [];
  if (context.canManageTarget) {
    commands.push({ command: 'rename', group: 'identity' });
  }
  if (context.isRoomOwner) {
    commands.push({ command: 'transfer', group: 'identity' });
    if (context.role === RoomParticipantRole.GeneralUser) {
      commands.push({ command: 'set-admin', group: 'identity' });
    } else if (context.role === RoomParticipantRole.Admin) {
      commands.push({ command: 'revoke-admin', group: 'identity' });
    }
  }
  if (context.canManageTarget) {
    commands.push(
      { command: 'mic', group: 'media' },
      { command: 'cam', group: 'media' },
      { command: 'chat', group: 'media' },
      { command: 'kick', group: 'danger' },
    );
  }
  return commands;
}

function micLabel(isSelf: boolean, isOn: boolean): string {
  if (isSelf) {
    return t(isOn ? 'Participants.MicClose' : 'Participants.MicOpen');
  }
  return t(isOn ? 'Participants.AudioDisable' : 'Participants.AudioAllow');
}

function camLabel(isSelf: boolean, isOn: boolean): string {
  if (isSelf) {
    return t(isOn ? 'Participants.CamClose' : 'Participants.CamOpen');
  }
  return t(isOn ? 'Participants.VideoDisable' : 'Participants.VideoAllow');
}

function roleTagOf(participant: RoomParticipant): ParticipantRoleTag {
  if (participant.role === RoomParticipantRole.Owner) {
    return 'owner';
  }
  return participant.role === RoomParticipantRole.Admin ? 'admin' : null;
}

/** Ringing callees that were rejected or timed out hold "no answer" for a moment. */
let noAnswerUserIds: ReadonlySet<string> = new Set<string>();
const noAnswerListeners = new Set<() => void>();
const noAnswerTimers = new Map<string, ReturnType<typeof setTimeout>>();

function setNoAnswerUserIds(next: ReadonlySet<string>) {
  noAnswerUserIds = next;
  noAnswerListeners.forEach(listener => listener());
}

function subscribeNoAnswer(listener: () => void): () => void {
  noAnswerListeners.add(listener);
  return () => {
    noAnswerListeners.delete(listener);
  };
}

function getNoAnswer(): ReadonlySet<string> {
  return noAnswerUserIds;
}

export function clearNoAnswer(userId: string) {
  clearTimeout(noAnswerTimers.get(userId));
  noAnswerTimers.delete(userId);
  if (noAnswerUserIds.has(userId)) {
    const next = new Set(noAnswerUserIds);
    next.delete(userId);
    setNoAnswerUserIds(next);
  }
}

export function markNoAnswer(userId: string) {
  clearNoAnswer(userId);
  setNoAnswerUserIds(new Set(noAnswerUserIds).add(userId));
  noAnswerTimers.set(userId, setTimeout(() => clearNoAnswer(userId), CALL_FAILED_HOLD_MS));
}

export function useParticipantPermission() {
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const { localParticipant } = useRoomParticipantState();

  const localUserId = loginUserInfo?.userId;
  const isRoomOwner = Boolean(localUserId) && currentRoom?.roomOwner?.userId === localUserId;
  const canManageMembers = isRoomOwner
    || (Boolean(localUserId) && localParticipant?.role === RoomParticipantRole.Admin);
  /** Only the host and admins may open their own device while the room disables it for everyone. */
  const isHostOrAdmin = localParticipant?.role === RoomParticipantRole.Owner
    || localParticipant?.role === RoomParticipantRole.Admin;

  function isLocal(participant: RoomParticipant): boolean {
    return Boolean(localUserId) && participant.userId === localUserId;
  }

  function canManageParticipant(participant: RoomParticipant): boolean {
    if (isLocal(participant) || !canManageMembers) {
      return false;
    }
    if (isRoomOwner) {
      return participant.role !== RoomParticipantRole.Owner;
    }
    return participant.role === RoomParticipantRole.GeneralUser;
  }

  function commandsFor(participant: RoomParticipant) {
    return availableCommands({
      isSelf: isLocal(participant),
      canManageTarget: canManageParticipant(participant),
      isRoomOwner,
      role: participant.role,
    });
  }

  return { localUserId, isRoomOwner, canManageMembers, isHostOrAdmin, isLocal, canManageParticipant, commandsFor };
}

function useJoinedRowBuilder() {
  useI18n();
  const { microphoneStatus, cameraStatus } = useDeviceState();
  const { isLocal, canManageParticipant, commandsFor } = useParticipantPermission();

  return function toJoinedRow(participant: RoomParticipant): JoinedRowData {
    const isSelf = isLocal(participant);
    const isMicOn = (isSelf ? microphoneStatus : participant.microphoneStatus) === DeviceStatus.On;
    const isCamOn = (isSelf ? cameraStatus : participant.cameraStatus) === DeviceStatus.On;
    const canOperateMedia = isSelf || canManageParticipant(participant);
    return {
      participant,
      userId: participant.userId,
      name: participantDisplayName(participant),
      avatarUrl: participant.avatarUrl,
      isSelf,
      roleTag: roleTagOf(participant),
      isSharing: participant.screenShareStatus === DeviceStatus.On,
      isMicOn,
      isCamOn,
      canOperateMedia,
      micTooltip: canOperateMedia
        ? micLabel(isSelf, isMicOn)
        : t(isMicOn ? 'Participants.MicOnHint' : 'Participants.MicOffHint'),
      camTooltip: canOperateMedia
        ? camLabel(isSelf, isCamOn)
        : t(isCamOn ? 'Participants.CamOnHint' : 'Participants.CamOffHint'),
      hasMenu: commandsFor(participant).length > 0,
    };
  };
}

function toPendingRow(participant: RoomParticipant, noAnswer: ReadonlySet<string>): PendingRowData {
  let callState: PendingCallState = 'idle';
  if (noAnswer.has(participant.userId)) {
    callState = 'no-answer';
  } else if (participant.roomStatus === RoomParticipantStatus.InCalling) {
    callState = 'calling';
  }
  return {
    participant,
    userId: participant.userId,
    name: participantDisplayName(participant),
    avatarUrl: participant.avatarUrl,
    callState,
  };
}

/**
 * Everything a member list renders. Call it once per list: it also listens for
 * rejected and timed-out calls to drive the "no answer" state of pending rows.
 */
export function useParticipantList() {
  const roomState = useRoomState();
  const { currentRoom, subscribeEvent, unsubscribeEvent } = roomState;
  const { pendingParticipantList } = useRoomParticipantState();
  const { participantList } = useShareParticipants();
  const { localUserId } = useParticipantPermission();
  const toJoinedRow = useJoinedRowBuilder();
  const noAnswer = useSyncExternalStore(subscribeNoAnswer, getNoAnswer, getNoAnswer);

  const [searchKeyword, setSearchKeyword] = useState('');
  const isSearching = Boolean(searchKeyword.trim());
  const roomId = currentRoom?.roomId;

  const joinedParticipants = useMemo(() => (
    [...participantList].sort((left, right) => compareParticipants(left, right, localUserId))
  ), [participantList, localUserId]);
  // AtomicX keeps leftover invites in a process-wide map until the SDK room exists.
  const pendingParticipants = useMemo(() => (
    roomId
      ? [...pendingParticipantList].sort((left, right) => compareParticipants(left, right, localUserId))
      : []
  ), [roomId, pendingParticipantList, localUserId]);

  const joinedRows = joinedParticipants
    .filter(participant => matchesParticipantQuery(participant, searchKeyword))
    .map(toJoinedRow);
  const pendingRows = pendingParticipants
    .filter(participant => matchesParticipantQuery(participant, searchKeyword))
    .map(participant => toPendingRow(participant, noAnswer));

  const joinedCount = joinedParticipants.length;
  const pendingCount = pendingParticipants.length;
  const hasPending = pendingCount > 0;
  const canCallAll = pendingParticipants.some(item => item.roomStatus !== RoomParticipantStatus.InCalling);
  const isSearchEmpty = isSearching && joinedRows.length === 0 && pendingRows.length === 0;
  /** The no-result copy split around the query, so the view can highlight it. */
  const marker = '\u0000';
  const [before = '', after = ''] = t('Participants.SearchEmptyDesc', { query: marker }).split(marker);
  const searchEmptyParts = { before, query: searchKeyword.trim(), after };
  /** Members already in the room or being rung cannot be picked again. */
  const occupiedIds = useMemo(() => [...new Set([
    ...joinedParticipants.map(item => item.userId),
    ...pendingParticipants
      .filter(item => item.roomStatus === RoomParticipantStatus.InCalling)
      .map(item => item.userId),
  ])], [joinedParticipants, pendingParticipants]);

  useEffect(() => {
    function onCallFailed({ roomInfo, call }: { roomInfo: RoomInfo; call: RoomCall }) {
      if (roomInfo.roomId === roomState.currentRoom?.roomId && call.caller.userId === localUserId) {
        markNoAnswer(call.callee.userId);
      }
    }
    subscribeEvent(RoomEvent.onCallRejected, onCallFailed);
    subscribeEvent(RoomEvent.onCallTimeout, onCallFailed);
    return () => {
      unsubscribeEvent(RoomEvent.onCallRejected, onCallFailed);
      unsubscribeEvent(RoomEvent.onCallTimeout, onCallFailed);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localUserId]);

  return {
    searchKeyword,
    setSearchKeyword,
    isSearching,
    isSearchEmpty,
    searchEmptyParts,
    joinedRows,
    pendingRows,
    joinedCount,
    pendingCount,
    hasPending,
    canCallAll,
    occupiedIds,
  };
}

/** Looks a joined member up by id; null once the member has left. */
export function useJoinedParticipant(userId: string): RoomParticipant | null {
  const { participantList } = useShareParticipants();
  return participantList.find(item => item.userId === userId) ?? null;
}

/** One joined member resolved to a row; null once the member has left. */
export function useJoinedRow(participant: RoomParticipant | null): JoinedRowData | null {
  const toJoinedRow = useJoinedRowBuilder();
  return participant ? toJoinedRow(participant) : null;
}

export function useParticipantMenu(participant: RoomParticipant | null) {
  const { commandsFor } = useParticipantPermission();
  const row = useJoinedRow(participant);

  let menuItems: ParticipantMenuItem[] = [];
  if (row) {
    const { isSelf, isMicOn, isCamOn } = row;
    const { isMessageDisabled } = row.participant;
    const labels: Record<ParticipantCommand, { label: string; icon: ComponentType<IconProps> }> = {
      'mic': { label: micLabel(isSelf, isMicOn), icon: isMicOn ? IconMic : IconMicOff },
      'cam': { label: camLabel(isSelf, isCamOn), icon: isCamOn ? IconCam : IconCamOff },
      'rename': { label: t('Participants.Rename'), icon: IconRename },
      'transfer': { label: t('Participants.TransferOwner'), icon: IconTransferOwner },
      'set-admin': { label: t('Participants.SetAdmin'), icon: IconSetAdmin },
      'revoke-admin': { label: t('Participants.RevokeAdmin'), icon: IconRevokeAdmin },
      'chat': {
        label: t(isMessageDisabled ? 'Participants.ChatUnmute' : 'Participants.ChatMute'),
        icon: isMessageDisabled ? IconChatOff : IconChat,
      },
      'kick': { label: t('Participants.Kick'), icon: IconKick },
    };
    menuItems = commandsFor(row.participant).map(({ command, group }, index, list) => ({
      command,
      ...labels[command],
      danger: group === 'danger',
      separatorBefore: index > 0 && list[index - 1].group !== group,
    }));
  }

  const menuGroups: ParticipantSheetItem[][] = [];
  menuItems.forEach((item) => {
    if (item.separatorBefore || menuGroups.length === 0) {
      menuGroups.push([]);
    }
    menuGroups[menuGroups.length - 1].push({ key: item.command, label: item.label, icon: item.icon, danger: item.danger });
  });

  return {
    row,
    displayName: row?.name ?? '',
    hasMenu: menuItems.length > 0,
    menuItems,
    menuGroups,
  };
}

export function useRoomControls() {
  useI18n();
  const { currentRoom } = useRoomState();
  const { canManageMembers } = useParticipantPermission();

  const micActive = Boolean(currentRoom?.isAllMicrophoneDisabled);
  const camActive = Boolean(currentRoom?.isAllCameraDisabled);
  const shareActive = Boolean(currentRoom?.isAllScreenShareDisabled);
  const microphoneControl: RoomControl = {
    key: 'mic-all',
    label: t(micActive ? 'Participants.UnmuteAll' : 'Participants.MuteAll'),
    active: micActive,
  };
  const cameraControl: RoomControl = {
    key: 'cam-all',
    label: t(camActive ? 'Participants.CamOnAll' : 'Participants.CamOffAll'),
    active: camActive,
  };
  const screenShareControl: RoomControl = {
    key: 'share-all',
    label: t(shareActive ? 'Participants.ShareEveryone' : 'Participants.ShareOwnerOnly'),
    active: shareActive,
  };

  return { canManageMembers, microphoneControl, cameraControl, screenShareControl };
}

/** Badge count follows the room record until the member list has loaded. */
export function useParticipantCount() {
  const { currentRoom } = useRoomState();
  const { participantList } = useRoomParticipantState();
  const count = currentRoom?.participantCount || participantList.length;
  const countLabel = count > 99 ? '99+' : String(count);
  return { count, countLabel };
}

/**
 * Process-wide room-enter load state, shared by every hook instance so the load
 * runs once per room change no matter which host component observed it first.
 */
let watchedRoomId: string | undefined;
let inFlight: Promise<void> | null = null;

/**
 * Loads members when a room appears and again whenever the caller mounts.
 * Mount reloads from the start because an earlier load can hit getUserList
 * before the engine is ready and return an empty list.
 */
export function useParticipantAutoLoad() {
  const roomState = useRoomState();
  const roomId = roomState.currentRoom?.roomId;
  const { getParticipantList, getAudienceList } = useRoomParticipantState();

  async function refreshParticipants(): Promise<void> {
    // AtomicX getInvitationList({ roomId: '' }) reloads leftover invites into the
    // process-wide pending map. Wait until the current SDK room exists.
    if (!roomState.currentRoom?.roomId) {
      return;
    }
    if (inFlight) {
      await inFlight;
      return;
    }
    inFlight = (async () => {
      try {
        await getParticipantList({ cursor: '' });
        await getAudienceList({ cursor: '' });
      } catch (error) {
        console.error('[RoomKit.participant] Failed to load participants:', error);
      } finally {
        inFlight = null;
      }
    })();
    await inFlight;
  }

  // Vue binds this watch in a detached effect scope; tuikit-atomicx-react exposes no
  // currentRoom subscription outside React, so the first mounted instance observes it.
  useEffect(() => {
    if (roomId === watchedRoomId) {
      return;
    }
    const previousRoomId = watchedRoomId;
    watchedRoomId = roomId;
    if (roomId && roomId !== previousRoomId) {
      void refreshParticipants();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    void refreshParticipants();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { refreshParticipants };
}
