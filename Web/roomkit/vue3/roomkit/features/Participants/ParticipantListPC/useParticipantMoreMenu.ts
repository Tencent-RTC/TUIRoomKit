import { computed } from 'vue';
import type { Component, Ref } from 'vue';
import { DeviceStatus, DeviceType } from 'tuikit-atomicx-vue3/room';
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
  TUIMessageBox,
  TUIToast,
  t,
} from '../../../base';
import { participantDisplayName, useParticipantActions } from './useParticipant';
import { resolveParticipantMoreCommands } from './participantMoreMenu';
import type { ParticipantMoreCommand, ParticipantMoreCommandSpec } from './participantMoreMenu';
import type { ParticipantFailure } from './useParticipant';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

export interface ParticipantMoreMenuItem extends ParticipantMoreCommandSpec {
  label: string;
  icon: Component;
}

export function useParticipantMoreMenu(participant: Ref<RoomParticipant>) {
  const {
    localMicrophoneStatus,
    localCameraStatus,
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
    renameParticipant,
  } = useParticipantActions();

  const isSelf = computed(() => isLocal(participant.value));
  const displayName = computed(() => participantDisplayName(participant.value));
  const canOperateMedia = computed(() => isSelf.value || canManageParticipant(participant.value));
  const isMicOn = computed(() =>
    isSelf.value
      ? localMicrophoneStatus.value === DeviceStatus.On
      : participant.value.microphoneStatus === DeviceStatus.On,
  );
  const isCamOn = computed(() =>
    isSelf.value
      ? localCameraStatus.value === DeviceStatus.On
      : participant.value.cameraStatus === DeviceStatus.On,
  );
  const micTitle = computed(() => {
    if (!canOperateMedia.value) {
      return isMicOn.value ? t('Participants.MicOnHint') : t('Participants.MicOffHint');
    }
    return commandLabel('mute');
  });
  const camTitle = computed(() => {
    if (!canOperateMedia.value) {
      return isCamOn.value ? t('Participants.CamOnHint') : t('Participants.CamOffHint');
    }
    return commandLabel('cam');
  });
  const menuItems = computed<ParticipantMoreMenuItem[]>(() => (
    resolveParticipantMoreCommands({
      isSelf: isSelf.value,
      canRename: canRename(participant.value),
      canTransferOwner: canTransferOwner(participant.value),
      canSetAdmin: canSetAdmin(participant.value),
      canRevokeAdmin: canRevokeAdmin(participant.value),
      canManage: canManageParticipant(participant.value),
    }).map(spec => ({
      ...spec,
      label: commandLabel(spec.command),
      icon: commandIcon(spec.command),
    }))
  ));
  const visible = computed(() => menuItems.value.length > 0);

  function commandLabel(command: ParticipantMoreCommand): string {
    const labels: Record<ParticipantMoreCommand, string> = {
      'mute': isSelf.value
        ? (isMicOn.value ? t('Participants.MicClose') : t('Participants.MicOpen'))
        : (isMicOn.value ? t('Participants.AudioDisable') : t('Participants.AudioAllow')),
      'cam': isSelf.value
        ? (isCamOn.value ? t('Participants.CamClose') : t('Participants.CamOpen'))
        : (isCamOn.value ? t('Participants.VideoDisable') : t('Participants.VideoAllow')),
      'rename': t('Participants.Rename'),
      'transfer': t('Participants.TransferOwner'),
      'set-admin': t('Participants.SetAdmin'),
      'revoke-admin': t('Participants.RevokeAdmin'),
      'chat': participant.value.isMessageDisabled
        ? t('Participants.ChatUnmute')
        : t('Participants.ChatMute'),
      'kick': t('Participants.Kick'),
    };
    return labels[command];
  }

  function commandIcon(command: ParticipantMoreCommand): Component {
    const icons: Record<ParticipantMoreCommand, Component> = {
      'mute': isMicOn.value ? IconMic : IconMicOff,
      'cam': isCamOn.value ? IconCam : IconCamOff,
      'rename': IconRename,
      'transfer': IconTransferOwner,
      'set-admin': IconSetAdmin,
      'revoke-admin': IconRevokeAdmin,
      'chat': participant.value.isMessageDisabled ? IconChatOff : IconChat,
      'kick': IconKick,
    };
    return icons[command];
  }

  function notify(failure?: ParticipantFailure) {
    if (!failure) {
      return false;
    }
    if (failure === 'all-mic-disabled') {
      TUIToast.warning(t('Device.AllMicDisabled'));
      return true;
    }
    if (failure === 'all-cam-disabled') {
      TUIToast.warning(t('Device.AllCamDisabled'));
      return true;
    }
    TUIToast[failure === 'failed' ? 'error' : 'warning'](t(`Participants.ActionFailure.${failure}`));
    return true;
  }

  async function toggleMic() {
    if (!canOperateMedia.value) {
      return;
    }
    if (isSelf.value) {
      const open = !isMicOn.value;
      if (notify(await setLocalMicrophoneOpen(open))) {
        return;
      }
      TUIToast.success(t(open ? 'Participants.MicOpened' : 'Participants.MicClosed'));
      return;
    }
    if (isMicOn.value) {
      if (notify(await closeRemoteDevice(participant.value, DeviceType.Microphone))) {
        return;
      }
      TUIToast.success(t('Participants.MuteDone', { name: displayName.value }));
      return;
    }
    if (notify(await inviteRemoteDevice(participant.value, DeviceType.Microphone))) {
      return;
    }
    TUIToast.success(t('Participants.UnmuteRequested', { name: displayName.value }));
  }

  async function toggleCam() {
    if (!canOperateMedia.value) {
      return;
    }
    if (isSelf.value) {
      const open = !isCamOn.value;
      if (notify(await setLocalCameraOpen(open))) {
        return;
      }
      TUIToast.success(t(open ? 'Participants.CamOpened' : 'Participants.CamClosed'));
      return;
    }
    if (isCamOn.value) {
      if (notify(await closeRemoteDevice(participant.value, DeviceType.Camera))) {
        return;
      }
      TUIToast.success(t('Participants.CamStopDone', { name: displayName.value }));
      return;
    }
    if (notify(await inviteRemoteDevice(participant.value, DeviceType.Camera))) {
      return;
    }
    TUIToast.success(t('Participants.CamRequested', { name: displayName.value }));
  }

  async function confirmRename(nameCard: string): Promise<boolean> {
    const next = nameCard.trim();
    if (!next) {
      return false;
    }
    if (notify(await renameParticipant(participant.value, next))) {
      return false;
    }
    TUIToast.success(t('Participants.RenameDone'));
    return true;
  }

  async function runCommand(command: string | number) {
    switch (command) {
      case 'mute':
        await toggleMic();
        return;
      case 'cam':
        await toggleCam();
        return;
      case 'set-admin':
        if (notify(await setParticipantAdmin(participant.value))) {
          return;
        }
        TUIToast.success(t('Participants.SetAdminDone', { name: displayName.value }));
        return;
      case 'revoke-admin':
        if (notify(await revokeParticipantAdmin(participant.value))) {
          return;
        }
        TUIToast.success(t('Participants.RevokeAdminDone', { name: displayName.value }));
        return;
      case 'chat': {
        const disable = !participant.value.isMessageDisabled;
        if (notify(await setChatDisabled(participant.value, disable))) {
          return;
        }
        TUIToast.success(t(
          disable ? 'Participants.ChatMuted' : 'Participants.ChatUnmuted',
          { name: displayName.value },
        ));
        return;
      }
      case 'transfer': {
        const confirmed = await TUIMessageBox.confirm({
          title: t('Participants.TransferOwner'),
          message: t('Participants.TransferOwnerMessage', { name: displayName.value }),
          confirmText: t('Participants.TransferOwnerConfirm'),
          cancelText: t('Participants.Cancel'),
        });
        if (!confirmed) {
          return;
        }
        if (notify(await transferRoomOwner(participant.value))) {
          return;
        }
        TUIToast.success(t('Participants.TransferOwnerDone', { name: displayName.value }));
        return;
      }
      case 'kick': {
        const confirmed = await TUIMessageBox.confirm({
          title: t('Participants.Kick'),
          message: t('Participants.KickMessage', { name: displayName.value }),
          confirmText: t('Participants.KickConfirm'),
          cancelText: t('Participants.Cancel'),
        });
        if (!confirmed) {
          return;
        }
        if (notify(await kickParticipant(participant.value))) {
          return;
        }
        TUIToast.success(t('Participants.KickDone', { name: displayName.value }));
      }
      /* Rename is owned by the menu view so each host can keep one dialog. */
      default:
    }
  }

  return {
    isSelf,
    displayName,
    isMicOn,
    isCamOn,
    canOperateMedia,
    visible,
    micTitle,
    camTitle,
    menuItems,
    toggleMic,
    toggleCam,
    confirmRename,
    runCommand,
  };
}
