import { ref } from 'vue';
import {
  DeviceStatus,
  DeviceType,
  RoomCallResult,
  RoomParticipantRole,
  RoomParticipantStatus,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { TUIMessageBox, TUIToast, t } from '../../base';
import { useScreenShare } from '../ScreenShare/ScreenShareButton/useScreenShare';
import type { PickedContact } from './contactData';
import {
  clearNoAnswer,
  formatNameList,
  markNoAnswer,
  participantDisplayName,
  useParticipantPermission,
} from './participantData';
import type { ParticipantCommand } from './participantData';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

/** The TUIErrorCode re-exported by atomicx has no admin-limit member, so the engine code is used directly. */
const ERROR_CODE_ADMIN_COUNT_LIMIT = 100020;
const DEVICE_REQUEST_TIMEOUT_SECONDS = 30;
const CALL_TIMEOUT_SECONDS = 60;

/** One lock for every member action on the page, not one per row. */
const isBusy = ref(false);
/** A call sent while another is still in flight is dropped. */
const isInviting = ref(false);
/** Shared by both list forms, so the picker opened from either closes after a successful invite. */
const invitePickerOpen = ref(false);

/**
 * Runs one engine call at a time. Failures are toasted here, so callers only
 * toast success; a call dropped while another runs resolves false silently.
 */
export async function runParticipantAction(action: () => Promise<unknown>): Promise<boolean> {
  if (isBusy.value) {
    return false;
  }
  isBusy.value = true;
  try {
    await action();
    return true;
  } catch (error) {
    if ((error as { code?: number }).code === ERROR_CODE_ADMIN_COUNT_LIMIT) {
      TUIToast.warning(t('Participants.ActionFailure.admin-limit'));
    } else {
      console.error('[RoomKit.participant] action failed:', error);
      TUIToast.error(t('Participants.ActionFailure.failed'));
    }
    return false;
  } finally {
    isBusy.value = false;
  }
}

type MediaDevice = DeviceType.Microphone | DeviceType.Camera;

export interface ParticipantActionOptions {
  /** Use the education-specific copy for classroom member operations. */
  education?: boolean;
}

export function useParticipantActions(options: ParticipantActionOptions = {}) {
  const { currentRoom } = useRoomState();
  const participantState = useRoomParticipantState();
  const {
    microphoneStatus,
    cameraStatus,
    openLocalMicrophone,
    closeLocalMicrophone,
    openLocalCamera,
    closeLocalCamera,
  } = useDeviceState();
  const { isLocalSharing, stopScreenShare } = useScreenShare();
  const { isLocal, isHostOrAdmin, canManageParticipant } = useParticipantPermission();

  async function toggleLocalMic() {
    const open = microphoneStatus.value !== DeviceStatus.On;
    if (open && currentRoom.value?.isAllMicrophoneDisabled && !isHostOrAdmin.value) {
      TUIToast.warning(t('Device.AllMicDisabled'));
      return;
    }
    const done = await runParticipantAction(async () => {
      if (!open) {
        await closeLocalMicrophone();
        return;
      }
      await openLocalMicrophone();
      await participantState.unmuteMicrophone();
    });
    if (done) {
      TUIToast.success(t(open ? 'Participants.MicOpened' : 'Participants.MicClosed'));
    }
  }

  async function toggleLocalCam() {
    const open = cameraStatus.value !== DeviceStatus.On;
    if (open && currentRoom.value?.isAllCameraDisabled && !isHostOrAdmin.value) {
      TUIToast.warning(t('Device.AllCamDisabled'));
      return;
    }
    if (await runParticipantAction(() => (open ? openLocalCamera() : closeLocalCamera()))) {
      TUIToast.success(t(open ? 'Participants.CamOpened' : 'Participants.CamClosed'));
    }
  }

  async function closeRemoteDevice(participant: RoomParticipant, deviceType: MediaDevice) {
    const { userId } = participant;
    if (!await runParticipantAction(() => participantState.closeParticipantDevice({ userId, deviceType }))) {
      return;
    }
    const name = participantDisplayName(participant);
    if (deviceType === DeviceType.Microphone) {
      TUIToast.success(t(options.education ? 'Education.Toast.MicOffTeacher' : 'Participants.MuteDone', { name }));
    } else {
      TUIToast.success(t(options.education ? 'Education.Toast.CamOffTeacher' : 'Participants.CamStopDone', { name }));
    }
  }

  async function inviteRemoteDevice(participant: RoomParticipant, device: MediaDevice) {
    const { userId } = participant;
    if (!await runParticipantAction(() => participantState.inviteToOpenDevice({
      userId,
      device,
      timeout: DEVICE_REQUEST_TIMEOUT_SECONDS,
    }))) {
      return;
    }
    const name = participantDisplayName(participant);
    if (device === DeviceType.Microphone) {
      TUIToast.success(t(options.education ? 'Education.Toast.InviteMicTeacher' : 'Participants.UnmuteRequested', { name }));
    } else {
      TUIToast.success(t(options.education ? 'Education.Toast.InviteCamTeacher' : 'Participants.CamRequested', { name }));
    }
  }

  async function toggleMic(participant: RoomParticipant) {
    if (isLocal(participant)) {
      await toggleLocalMic();
      return;
    }
    if (!canManageParticipant(participant)) {
      return;
    }
    if (participant.microphoneStatus === DeviceStatus.On) {
      await closeRemoteDevice(participant, DeviceType.Microphone);
    } else {
      await inviteRemoteDevice(participant, DeviceType.Microphone);
    }
  }

  async function toggleCam(participant: RoomParticipant) {
    if (isLocal(participant)) {
      await toggleLocalCam();
      return;
    }
    if (!canManageParticipant(participant)) {
      return;
    }
    if (participant.cameraStatus === DeviceStatus.On) {
      await closeRemoteDevice(participant, DeviceType.Camera);
    } else {
      await inviteRemoteDevice(participant, DeviceType.Camera);
    }
  }

  async function toggleChat(participant: RoomParticipant) {
    const { userId, isMessageDisabled } = participant;
    const name = participantDisplayName(participant);
    if (await runParticipantAction(() => participantState.disableUserMessage({ userId, disable: !isMessageDisabled }))) {
      TUIToast.success(t(isMessageDisabled ? 'Participants.ChatUnmuted' : 'Participants.ChatMuted', { name }));
    }
  }

  async function setAdmin(participant: RoomParticipant) {
    const { userId } = participant;
    if (await runParticipantAction(() => participantState.setAdmin({ userId }))) {
      TUIToast.success(t('Participants.SetAdminDone', { name: participantDisplayName(participant) }));
    }
  }

  async function revokeAdmin(participant: RoomParticipant) {
    const { userId } = participant;
    if (await runParticipantAction(() => participantState.revokeAdmin({ userId }))) {
      TUIToast.success(t('Participants.RevokeAdminDone', { name: participantDisplayName(participant) }));
    }
  }

  async function transferOwner(participant: RoomParticipant) {
    const { userId } = participant;
    const name = participantDisplayName(participant);
    const confirmed = await TUIMessageBox.confirm({
      title: t('Participants.TransferOwner'),
      message: t('Participants.TransferOwnerMessage', { name }),
      confirmText: t('Participants.TransferOwnerConfirm'),
      cancelText: t('Participants.Cancel'),
    });
    // An owner-only share would outlive the new owner's right to stop it.
    const done = confirmed && await runParticipantAction(async () => {
      if (currentRoom.value?.isAllScreenShareDisabled && isLocalSharing.value) {
        await stopScreenShare();
      }
      await participantState.transferOwner({ userId });
    });
    if (done) {
      TUIToast.success(t('Participants.TransferOwnerDone', { name }));
    }
  }

  async function kick(participant: RoomParticipant) {
    const { userId } = participant;
    const name = participantDisplayName(participant);
    const confirmed = await TUIMessageBox.danger({
      title: t('Participants.Kick'),
      message: t('Participants.KickMessage', { name }),
      confirmText: t('Participants.KickConfirm'),
      cancelText: t('Participants.Cancel'),
    });
    if (confirmed && await runParticipantAction(() => participantState.kickUser({ userId }))) {
      TUIToast.success(t('Participants.KickDone', { name }));
    }
  }

  async function rename(participant: RoomParticipant, nameCard: string): Promise<boolean> {
    const next = nameCard.trim();
    const { userId } = participant;
    if (!next || !await runParticipantAction(() => participantState.updateParticipantNameCard({ userId, nameCard: next }))) {
      return false;
    }
    TUIToast.success(t('Participants.RenameDone'));
    return true;
  }

  /** Rename needs a name from a dialog first, so the views route it to `rename` themselves. */
  const commandHandlers: Record<Exclude<ParticipantCommand, 'rename'>, (participant: RoomParticipant) => Promise<void>> = {
    'mic': toggleMic,
    'cam': toggleCam,
    'chat': toggleChat,
    'set-admin': setAdmin,
    'revoke-admin': revokeAdmin,
    'transfer': transferOwner,
    'kick': kick,
  };

  function runCommand(command: Exclude<ParticipantCommand, 'rename'>, participant: RoomParticipant) {
    return commandHandlers[command](participant);
  }

  return {
    toggleMic,
    toggleCam,
    toggleChat,
    setAdmin,
    revokeAdmin,
    transferOwner,
    kick,
    rename,
    runCommand,
  };
}

export function useRoomControlActions() {
  const { currentRoom } = useRoomState();
  const { participantList, disableAllDevices } = useRoomParticipantState();

  function setAllDevicesDisabled(deviceType: DeviceType, disable: boolean): Promise<boolean> {
    return runParticipantAction(() => disableAllDevices({ deviceType, disable }));
  }

  async function toggleAllMicrophone() {
    const disable = !currentRoom.value?.isAllMicrophoneDisabled;
    if (await setAllDevicesDisabled(DeviceType.Microphone, disable)) {
      TUIToast.success(t(disable ? 'Participants.MuteAllDone' : 'Participants.UnmuteAllDone'));
    }
  }

  async function toggleAllCamera() {
    const disable = !currentRoom.value?.isAllCameraDisabled;
    if (await setAllDevicesDisabled(DeviceType.Camera, disable)) {
      TUIToast.success(t(disable ? 'Participants.CamOffAllDone' : 'Participants.CamOnAllDone'));
    }
  }

  async function toggleAllScreenShare() {
    const disable = !currentRoom.value?.isAllScreenShareDisabled;
    const generalSharing = participantList.value.some(participant => (
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
    if (await setAllDevicesDisabled(DeviceType.ScreenShare, disable)) {
      TUIToast.success(t(disable ? 'Participants.ShareOwnerOnlyDone' : 'Participants.ShareEveryoneDone'));
    }
  }

  return { toggleAllMicrophone, toggleAllCamera, toggleAllScreenShare };
}

export function useParticipantCall() {
  const { currentRoom, callUserToRoom } = useRoomState();
  const { pendingParticipantList } = useRoomParticipantState();

  async function callUsers(userIdList: string[]): Promise<boolean> {
    const roomId = currentRoom.value?.roomId;
    if (!roomId) {
      TUIToast.warning(t('Participants.InviteFailure.no-room'));
      return false;
    }
    if (isInviting.value) {
      return false;
    }
    isInviting.value = true;
    userIdList.forEach(clearNoAnswer);
    try {
      const results = await callUserToRoom({ roomId, userIdList, timeout: CALL_TIMEOUT_SECONDS });
      results.forEach((result, userId) => {
        if (result === RoomCallResult.AlreadyInCalling) {
          markNoAnswer(userId);
        }
      });
      return true;
    } catch (error) {
      console.error('[RoomKit.participant] Failed to invite users:', error);
      TUIToast.error(t('Participants.InviteFailure.failed'));
      return false;
    } finally {
      isInviting.value = false;
    }
  }

  async function callOne(participant: RoomParticipant) {
    if (await callUsers([participant.userId])) {
      TUIToast.success(t('Participants.CallStarted', { name: participantDisplayName(participant) }));
    }
  }

  async function callAll() {
    const targets = currentRoom.value?.roomId
      ? pendingParticipantList.value.filter(item => item.roomStatus !== RoomParticipantStatus.InCalling)
      : [];
    if (targets.length === 0) {
      TUIToast.warning(t('Participants.CallAllEmpty'));
      return;
    }
    const name = formatNameList(targets.map(participantDisplayName));
    if (await callUsers(targets.map(item => item.userId))) {
      TUIToast.success(t('Participants.CallAllStarted', { name }));
    }
  }

  function openInvitePicker() {
    invitePickerOpen.value = true;
  }

  async function inviteContacts(contacts: PickedContact[]) {
    if (contacts.length === 0) {
      TUIToast.warning(t('Participants.InviteFailure.empty'));
      return;
    }
    if (!await callUsers(contacts.map(contact => contact.userId))) {
      return;
    }
    TUIToast.success(t('Participants.CallStarted', {
      name: formatNameList(contacts.map(contact => contact.userName || contact.userId)),
    }));
    invitePickerOpen.value = false;
  }

  return { invitePickerOpen, openInvitePicker, callOne, callAll, inviteContacts };
}
