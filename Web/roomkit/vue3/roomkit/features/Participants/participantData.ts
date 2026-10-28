import { computed, effectScope, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Component, Ref } from 'vue';
import {
  DeviceStatus,
  RoomEvent,
  RoomParticipantRole,
  RoomParticipantStatus,
  useDeviceState,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
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
  t,
} from '../../base';
import type { RoomCall, RoomInfo, RoomParticipant } from 'tuikit-atomicx-vue3/room';

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
  icon: Component;
  danger: boolean;
  separatorBefore: boolean;
}

/** Shape of one row in the mobile action sheet. */
export interface ParticipantSheetItem {
  key: string;
  label: string;
  icon?: Component;
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
const noAnswerUserIds = ref(new Set<string>());
const noAnswerTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function clearNoAnswer(userId: string) {
  clearTimeout(noAnswerTimers.get(userId));
  noAnswerTimers.delete(userId);
  if (noAnswerUserIds.value.has(userId)) {
    const next = new Set(noAnswerUserIds.value);
    next.delete(userId);
    noAnswerUserIds.value = next;
  }
}

export function markNoAnswer(userId: string) {
  clearNoAnswer(userId);
  noAnswerUserIds.value = new Set(noAnswerUserIds.value).add(userId);
  noAnswerTimers.set(userId, setTimeout(() => clearNoAnswer(userId), CALL_FAILED_HOLD_MS));
}

export function useParticipantPermission() {
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const { localParticipant } = useRoomParticipantState();

  const localUserId = computed(() => loginUserInfo.value?.userId);
  const isRoomOwner = computed(() => (
    Boolean(localUserId.value) && currentRoom.value?.roomOwner?.userId === localUserId.value
  ));
  const canManageMembers = computed(() => (
    isRoomOwner.value
    || (Boolean(localUserId.value) && localParticipant.value?.role === RoomParticipantRole.Admin)
  ));
  /** Only the host and admins may open their own device while the room disables it for everyone. */
  const isHostOrAdmin = computed(() => (
    localParticipant.value?.role === RoomParticipantRole.Owner
    || localParticipant.value?.role === RoomParticipantRole.Admin
  ));

  function isLocal(participant: RoomParticipant): boolean {
    return Boolean(localUserId.value) && participant.userId === localUserId.value;
  }

  function canManageParticipant(participant: RoomParticipant): boolean {
    if (isLocal(participant) || !canManageMembers.value) {
      return false;
    }
    if (isRoomOwner.value) {
      return participant.role !== RoomParticipantRole.Owner;
    }
    return participant.role === RoomParticipantRole.GeneralUser;
  }

  function commandsFor(participant: RoomParticipant) {
    return availableCommands({
      isSelf: isLocal(participant),
      canManageTarget: canManageParticipant(participant),
      isRoomOwner: isRoomOwner.value,
      role: participant.role,
    });
  }

  return { localUserId, isRoomOwner, canManageMembers, isHostOrAdmin, isLocal, canManageParticipant, commandsFor };
}

function useJoinedRowBuilder() {
  const { microphoneStatus, cameraStatus } = useDeviceState();
  const { isLocal, canManageParticipant, commandsFor } = useParticipantPermission();

  return function toJoinedRow(participant: RoomParticipant): JoinedRowData {
    const isSelf = isLocal(participant);
    const isMicOn = (isSelf ? microphoneStatus.value : participant.microphoneStatus) === DeviceStatus.On;
    const isCamOn = (isSelf ? cameraStatus.value : participant.cameraStatus) === DeviceStatus.On;
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

function toPendingRow(participant: RoomParticipant): PendingRowData {
  let callState: PendingCallState = 'idle';
  if (noAnswerUserIds.value.has(participant.userId)) {
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
  const { currentRoom, subscribeEvent, unsubscribeEvent } = useRoomState();
  const { participantList, pendingParticipantList } = useRoomParticipantState();
  const { localUserId } = useParticipantPermission();
  const toJoinedRow = useJoinedRowBuilder();

  const searchKeyword = ref('');
  const isSearching = computed(() => Boolean(searchKeyword.value.trim()));

  const joinedParticipants = computed(() => (
    [...participantList.value].sort((left, right) => compareParticipants(left, right, localUserId.value))
  ));
  // AtomicX keeps leftover invites in a process-wide map until the SDK room exists.
  const pendingParticipants = computed(() => (
    currentRoom.value?.roomId
      ? [...pendingParticipantList.value].sort((left, right) => compareParticipants(left, right, localUserId.value))
      : []
  ));

  const joinedRows = computed(() => joinedParticipants.value
    .filter(participant => matchesParticipantQuery(participant, searchKeyword.value))
    .map(toJoinedRow));
  const pendingRows = computed(() => pendingParticipants.value
    .filter(participant => matchesParticipantQuery(participant, searchKeyword.value))
    .map(toPendingRow));

  const joinedCount = computed(() => joinedParticipants.value.length);
  const pendingCount = computed(() => pendingParticipants.value.length);
  const hasPending = computed(() => pendingCount.value > 0);
  const canCallAll = computed(() => (
    pendingParticipants.value.some(item => item.roomStatus !== RoomParticipantStatus.InCalling)
  ));
  const isSearchEmpty = computed(() => (
    isSearching.value && joinedRows.value.length === 0 && pendingRows.value.length === 0
  ));
  /** The no-result copy split around the query, so the view can highlight it. */
  const searchEmptyParts = computed(() => {
    const marker = '\u0000';
    const [before = '', after = ''] = t('Participants.SearchEmptyDesc', { query: marker }).split(marker);
    return { before, query: searchKeyword.value.trim(), after };
  });
  /** Members already in the room or being rung cannot be picked again. */
  const occupiedIds = computed(() => [...new Set([
    ...joinedParticipants.value.map(item => item.userId),
    ...pendingParticipants.value
      .filter(item => item.roomStatus === RoomParticipantStatus.InCalling)
      .map(item => item.userId),
  ])]);

  function onCallFailed({ roomInfo, call }: { roomInfo: RoomInfo; call: RoomCall }) {
    if (roomInfo.roomId === currentRoom.value?.roomId && call.caller.userId === localUserId.value) {
      markNoAnswer(call.callee.userId);
    }
  }

  onMounted(() => {
    subscribeEvent(RoomEvent.onCallRejected, onCallFailed);
    subscribeEvent(RoomEvent.onCallTimeout, onCallFailed);
  });
  onBeforeUnmount(() => {
    unsubscribeEvent(RoomEvent.onCallRejected, onCallFailed);
    unsubscribeEvent(RoomEvent.onCallTimeout, onCallFailed);
  });

  return {
    searchKeyword,
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
export function useJoinedParticipant(userId: Ref<string>) {
  const { participantList } = useRoomParticipantState();
  return computed(() => participantList.value.find(item => item.userId === userId.value) ?? null);
}

/** One joined member resolved to a row; null once the member has left. */
export function useJoinedRow(participant: Ref<RoomParticipant | null>) {
  const toJoinedRow = useJoinedRowBuilder();
  return computed(() => (participant.value ? toJoinedRow(participant.value) : null));
}

export function useParticipantMenu(participant: Ref<RoomParticipant | null>) {
  const { commandsFor } = useParticipantPermission();
  const row = useJoinedRow(participant);

  const menuItems = computed<ParticipantMenuItem[]>(() => {
    const current = row.value;
    if (!current) {
      return [];
    }
    const { isSelf, isMicOn, isCamOn } = current;
    const { isMessageDisabled } = current.participant;
    const labels: Record<ParticipantCommand, { label: string; icon: Component }> = {
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
    return commandsFor(current.participant).map(({ command, group }, index, list) => ({
      command,
      ...labels[command],
      danger: group === 'danger',
      separatorBefore: index > 0 && list[index - 1].group !== group,
    }));
  });

  const menuGroups = computed<ParticipantSheetItem[][]>(() => {
    const groups: ParticipantSheetItem[][] = [];
    menuItems.value.forEach((item) => {
      if (item.separatorBefore || groups.length === 0) {
        groups.push([]);
      }
      groups[groups.length - 1].push({ key: item.command, label: item.label, icon: item.icon, danger: item.danger });
    });
    return groups;
  });

  return {
    row,
    displayName: computed(() => row.value?.name ?? ''),
    hasMenu: computed(() => menuItems.value.length > 0),
    menuItems,
    menuGroups,
  };
}

export function useRoomControls() {
  const { currentRoom } = useRoomState();
  const { canManageMembers } = useParticipantPermission();

  const microphoneControl = computed<RoomControl>(() => {
    const active = Boolean(currentRoom.value?.isAllMicrophoneDisabled);
    return { key: 'mic-all', label: t(active ? 'Participants.UnmuteAll' : 'Participants.MuteAll'), active };
  });
  const cameraControl = computed<RoomControl>(() => {
    const active = Boolean(currentRoom.value?.isAllCameraDisabled);
    return { key: 'cam-all', label: t(active ? 'Participants.CamOnAll' : 'Participants.CamOffAll'), active };
  });
  const screenShareControl = computed<RoomControl>(() => {
    const active = Boolean(currentRoom.value?.isAllScreenShareDisabled);
    return { key: 'share-all', label: t(active ? 'Participants.ShareEveryone' : 'Participants.ShareOwnerOnly'), active };
  });

  return { canManageMembers, microphoneControl, cameraControl, screenShareControl };
}

/** Badge count follows the room record until the member list has loaded. */
export function useParticipantCount() {
  const { currentRoom } = useRoomState();
  const { participantList } = useRoomParticipantState();
  const count = computed(() => currentRoom.value?.participantCount || participantList.value.length);
  const countLabel = computed(() => (count.value > 99 ? '99+' : String(count.value)));
  return { count, countLabel };
}

/** Detached so toolbar unmount / overflow does not stop the room-enter load. */
const participantLoadScope = effectScope(true);
let hasBoundRoomWatch = false;
let inFlight: Promise<void> | null = null;

/**
 * Loads members when a room appears and again whenever the caller mounts.
 * Mount reloads from the start because an earlier load can hit getUserList
 * before the engine is ready and return an empty list.
 */
export function useParticipantAutoLoad() {
  const { currentRoom } = useRoomState();
  const { getParticipantList, getAudienceList } = useRoomParticipantState();

  async function refreshParticipants(): Promise<void> {
    // AtomicX getInvitationList({ roomId: '' }) reloads leftover invites into the
    // process-wide pending map. Wait until the current SDK room exists.
    if (!currentRoom.value?.roomId) {
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

  if (!hasBoundRoomWatch) {
    hasBoundRoomWatch = true;
    participantLoadScope.run(() => {
      watch(
        () => currentRoom.value?.roomId,
        (roomId, previousRoomId) => {
          if (roomId && roomId !== previousRoomId) {
            void refreshParticipants();
          }
        },
        { immediate: true },
      );
    });
  }

  onMounted(() => {
    void refreshParticipants();
  });

  return { refreshParticipants };
}
