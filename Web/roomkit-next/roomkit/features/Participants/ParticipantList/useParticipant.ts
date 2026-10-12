import { computed, effectScope, readonly, ref, watch } from 'vue';
import {
  DeviceStatus,
  DeviceType,
  RoomParticipantRole,
  RoomParticipantStatus,
  useDeviceState,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { t } from '../../../i18n';
import { useScreenShare } from '../../ScreenShare/ScreenShareButton/useScreenShare';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

export type ParticipantFailure =
  | 'not-allowed'
  | 'admin-limit'
  | 'failed'
  | 'all-mic-disabled'
  | 'all-cam-disabled';

/** The TUIErrorCode re-exported by atomicx has no admin-limit member, so the engine code is used directly. */
const ERROR_CODE_ADMIN_COUNT_LIMIT = 100020;

const isBusy = ref(false);
/** Detached so toolbar unmount / overflow does not stop the room-enter load. */
const participantLoadScope = effectScope(true);
let hasBoundRoomWatch = false;
let inFlight: Promise<void> | null = null;

export function participantDisplayName(
  participant: Pick<RoomParticipant, 'userId' | 'userName'> & { nameCard?: string },
): string {
  return (participant.nameCard || participant.userName || participant.userId).trim();
}

/**
 * Keeps the call toast on a single line: a few names plus a total count.
 * Names are never truncated; the first one is always shown in full and the
 * rest only join while they fit the width budget of the 420px toast.
 */
const NAME_LIST_MAX = 3;
const NAME_LIST_BUDGET = 20;

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

function compareParticipants(a: RoomParticipant, b: RoomParticipant, localUserId?: string): number {
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

export function useParticipantActions() {
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const {
    localParticipant,
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
  const {
    microphoneStatus,
    cameraStatus,
    openLocalMicrophone,
    closeLocalMicrophone,
    openLocalCamera,
    closeLocalCamera,
  } = useDeviceState();
  const { isLocalSharing, stopScreenShare } = useScreenShare();

  const localUserId = computed(() => loginUserInfo.value?.userId);
  const canManageMembers = computed(() => {
    const userId = localUserId.value;
    if (!userId) {
      return false;
    }
    if (currentRoom.value?.roomOwner?.userId === userId) {
      return true;
    }
    return localParticipant.value?.role === RoomParticipantRole.Admin;
  });
  const isRoomOwner = computed(() => {
    const userId = localUserId.value;
    return Boolean(userId) && currentRoom.value?.roomOwner?.userId === userId;
  });

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

  function canRename(participant: RoomParticipant): boolean {
    if (isLocal(participant)) {
      return true;
    }
    return canManageParticipant(participant);
  }

  function canTransferOwner(participant: RoomParticipant): boolean {
    return isRoomOwner.value && !isLocal(participant);
  }

  function canSetAdmin(participant: RoomParticipant): boolean {
    return isRoomOwner.value && participant.role === RoomParticipantRole.GeneralUser;
  }

  function canRevokeAdmin(participant: RoomParticipant): boolean {
    return isRoomOwner.value && participant.role === RoomParticipantRole.Admin;
  }

  /** Host and admin keep control; others cannot open a device the room has disabled for everyone. */
  function canOpenDespiteRoomPolicy(): boolean {
    const role = localParticipant.value?.role;
    return role === RoomParticipantRole.Owner || role === RoomParticipantRole.Admin;
  }

  async function runAction(action: () => Promise<void>): Promise<ParticipantFailure | undefined> {
    if (isBusy.value) {
      return undefined;
    }
    isBusy.value = true;
    try {
      await action();
      return undefined;
    } catch (error) {
      const err = error as { code?: number };
      if (err.code === ERROR_CODE_ADMIN_COUNT_LIMIT) {
        return 'admin-limit';
      }
      console.error('[RoomKit.participant] action failed:', error);
      return 'failed';
    } finally {
      isBusy.value = false;
    }
  }

  async function kickParticipant(participant: RoomParticipant): Promise<ParticipantFailure | undefined> {
    if (!canManageParticipant(participant)) {
      return 'not-allowed';
    }
    return runAction(() => kickUser({ userId: participant.userId }));
  }

  async function setParticipantAdmin(participant: RoomParticipant): Promise<ParticipantFailure | undefined> {
    if (!canSetAdmin(participant)) {
      return 'not-allowed';
    }
    return runAction(() => setAdmin({ userId: participant.userId }));
  }

  async function revokeParticipantAdmin(participant: RoomParticipant): Promise<ParticipantFailure | undefined> {
    if (!canRevokeAdmin(participant)) {
      return 'not-allowed';
    }
    return runAction(() => revokeAdmin({ userId: participant.userId }));
  }

  async function transferRoomOwner(participant: RoomParticipant): Promise<ParticipantFailure | undefined> {
    if (!canTransferOwner(participant)) {
      return 'not-allowed';
    }
    return runAction(async () => {
      if (currentRoom.value?.isAllScreenShareDisabled && isLocalSharing.value) {
        await stopScreenShare();
      }
      await transferOwner({ userId: participant.userId });
    });
  }

  async function closeRemoteDevice(
    participant: RoomParticipant,
    deviceType: DeviceType,
  ): Promise<ParticipantFailure | undefined> {
    if (!canManageParticipant(participant)) {
      return 'not-allowed';
    }
    return runAction(() => closeParticipantDevice({ userId: participant.userId, deviceType }));
  }

  async function inviteRemoteDevice(
    participant: RoomParticipant,
    device: DeviceType,
  ): Promise<ParticipantFailure | undefined> {
    if (!canManageParticipant(participant)) {
      return 'not-allowed';
    }
    return runAction(() => inviteToOpenDevice({ userId: participant.userId, device, timeout: 30 }));
  }

  /**
   * Local devices are driven by the dedicated openLocal / closeLocal device APIs,
   * while remote ones go through closeRemoteDevice / inviteRemoteDevice instead.
   */
  async function setLocalMicrophoneOpen(open: boolean): Promise<ParticipantFailure | undefined> {
    if (open && !canOpenDespiteRoomPolicy() && currentRoom.value?.isAllMicrophoneDisabled) {
      return 'all-mic-disabled';
    }
    return runAction(async () => {
      if (!open) {
        await closeLocalMicrophone();
        return;
      }
      await openLocalMicrophone();
      await unmuteMicrophone();
    });
  }

  async function setLocalCameraOpen(open: boolean): Promise<ParticipantFailure | undefined> {
    if (open && !canOpenDespiteRoomPolicy() && currentRoom.value?.isAllCameraDisabled) {
      return 'all-cam-disabled';
    }
    return runAction(() => (open ? openLocalCamera() : closeLocalCamera()));
  }

  async function setChatDisabled(
    participant: RoomParticipant,
    disable: boolean,
  ): Promise<ParticipantFailure | undefined> {
    if (!canManageParticipant(participant)) {
      return 'not-allowed';
    }
    return runAction(() => disableUserMessage({ userId: participant.userId, disable }));
  }

  async function setAllDevicesDisabled(
    deviceType: DeviceType,
    disable: boolean,
  ): Promise<ParticipantFailure | undefined> {
    if (!canManageMembers.value) {
      return 'not-allowed';
    }
    return runAction(() => disableAllDevices({ deviceType, disable }));
  }

  async function renameParticipant(
    participant: RoomParticipant,
    nameCard: string,
  ): Promise<ParticipantFailure | undefined> {
    if (!canRename(participant)) {
      return 'not-allowed';
    }
    const next = nameCard.trim();
    if (!next) {
      return 'failed';
    }
    return runAction(() => updateParticipantNameCard({ userId: participant.userId, nameCard: next }));
  }

  return {
    localParticipant,
    localMicrophoneStatus: microphoneStatus,
    localCameraStatus: cameraStatus,
    canManageMembers,
    isRoomOwner,
    isBusy: readonly(isBusy),
    isAllMicrophoneDisabled: computed(() => Boolean(currentRoom.value?.isAllMicrophoneDisabled)),
    isAllCameraDisabled: computed(() => Boolean(currentRoom.value?.isAllCameraDisabled)),
    isAllScreenShareDisabled: computed(() => Boolean(currentRoom.value?.isAllScreenShareDisabled)),
    isLocal,
    canManageParticipant,
    canRename,
    canTransferOwner,
    canSetAdmin,
    canRevokeAdmin,
    kickParticipant,
    setParticipantAdmin,
    revokeParticipantAdmin,
    transferRoomOwner,
    closeRemoteDevice,
    inviteRemoteDevice,
    setLocalMicrophoneOpen,
    setLocalCameraOpen,
    setChatDisabled,
    setAllDevicesDisabled,
    renameParticipant,
  };
}

export function useParticipantList() {
  const { currentRoom } = useRoomState();
  const {
    participantList,
    pendingParticipantList,
    localParticipant,
    getParticipantList,
    getAudienceList,
  } = useRoomParticipantState();
  const localUserId = computed(() => localParticipant.value?.userId);

  const joinedParticipants = computed(() => (
    [...participantList.value].sort((left, right) => compareParticipants(left, right, localUserId.value))
  ));

  const pendingParticipants = computed(() => (
    currentRoom.value?.roomId
      ? [...pendingParticipantList.value].sort((left, right) => compareParticipants(left, right, localUserId.value))
      : []
  ));

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
        // Click-to-open must reload from the start. An earlier watch can hit
        // getUserList before the engine is ready and return an empty list.
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

  return { joinedParticipants, pendingParticipants, refreshParticipants };
}
