import type { ComponentType } from 'react';
import { DeviceStatus, DeviceType } from 'tuikit-atomicx-react/room';
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
} from '../../../base';
import type { IconProps } from '../../../base';
import { t } from '../../../i18n';
import { participantDisplayName, useParticipantActions } from './useParticipant';
import { resolveParticipantMoreCommands } from './participantMoreMenu';
import type { ParticipantMoreCommand, ParticipantMoreCommandSpec } from './participantMoreMenu';
import type { ParticipantFailure } from './useParticipant';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';

export interface ParticipantMoreMenuItem extends ParticipantMoreCommandSpec {
  label: string;
  icon: ComponentType<IconProps>;
}

export function useParticipantMoreMenu(participant: RoomParticipant) {
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

  const isSelf = isLocal(participant);
  const displayName = participantDisplayName(participant);
  const canOperateMedia = isSelf || canManageParticipant(participant);
  const isMicOn = isSelf
    ? localMicrophoneStatus === DeviceStatus.On
    : participant.microphoneStatus === DeviceStatus.On;
  const isCamOn = isSelf
    ? localCameraStatus === DeviceStatus.On
    : participant.cameraStatus === DeviceStatus.On;

  function commandLabel(command: ParticipantMoreCommand): string {
    function micLabel(): string {
      if (isSelf) {
        return isMicOn ? t('Participants.MicClose') : t('Participants.MicOpen');
      }
      return isMicOn ? t('Participants.AudioDisable') : t('Participants.AudioAllow');
    }

    function camLabel(): string {
      if (isSelf) {
        return isCamOn ? t('Participants.CamClose') : t('Participants.CamOpen');
      }
      return isCamOn ? t('Participants.VideoDisable') : t('Participants.VideoAllow');
    }

    const labels: Record<ParticipantMoreCommand, string> = {
      'mute': micLabel(),
      'cam': camLabel(),
      'rename': t('Participants.Rename'),
      'transfer': t('Participants.TransferOwner'),
      'set-admin': t('Participants.SetAdmin'),
      'revoke-admin': t('Participants.RevokeAdmin'),
      'chat': participant.isMessageDisabled
        ? t('Participants.ChatUnmute')
        : t('Participants.ChatMute'),
      'kick': t('Participants.Kick'),
    };
    return labels[command];
  }

  function commandIcon(command: ParticipantMoreCommand): ComponentType<IconProps> {
    const icons: Record<ParticipantMoreCommand, ComponentType<IconProps>> = {
      'mute': isMicOn ? IconMic : IconMicOff,
      'cam': isCamOn ? IconCam : IconCamOff,
      'rename': IconRename,
      'transfer': IconTransferOwner,
      'set-admin': IconSetAdmin,
      'revoke-admin': IconRevokeAdmin,
      'chat': participant.isMessageDisabled ? IconChatOff : IconChat,
      'kick': IconKick,
    };
    return icons[command];
  }

  const micTitle = (() => {
    if (!canOperateMedia) {
      return isMicOn ? t('Participants.MicOnHint') : t('Participants.MicOffHint');
    }
    return commandLabel('mute');
  })();
  const camTitle = (() => {
    if (!canOperateMedia) {
      return isCamOn ? t('Participants.CamOnHint') : t('Participants.CamOffHint');
    }
    return commandLabel('cam');
  })();
  const menuItems: ParticipantMoreMenuItem[] = resolveParticipantMoreCommands({
    isSelf,
    canRename: canRename(participant),
    canTransferOwner: canTransferOwner(participant),
    canSetAdmin: canSetAdmin(participant),
    canRevokeAdmin: canRevokeAdmin(participant),
    canManage: canManageParticipant(participant),
  }).map(spec => ({
    ...spec,
    label: commandLabel(spec.command),
    icon: commandIcon(spec.command),
  }));
  const visible = menuItems.length > 0;

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
    if (!canOperateMedia) {
      return;
    }
    if (isSelf) {
      const open = !isMicOn;
      if (notify(await setLocalMicrophoneOpen(open))) {
        return;
      }
      TUIToast.success(t(open ? 'Participants.MicOpened' : 'Participants.MicClosed'));
      return;
    }
    if (isMicOn) {
      if (notify(await closeRemoteDevice(participant, DeviceType.Microphone))) {
        return;
      }
      TUIToast.success(t('Participants.MuteDone', { name: displayName }));
      return;
    }
    if (notify(await inviteRemoteDevice(participant, DeviceType.Microphone))) {
      return;
    }
    TUIToast.success(t('Participants.UnmuteRequested', { name: displayName }));
  }

  async function toggleCam() {
    if (!canOperateMedia) {
      return;
    }
    if (isSelf) {
      const open = !isCamOn;
      if (notify(await setLocalCameraOpen(open))) {
        return;
      }
      TUIToast.success(t(open ? 'Participants.CamOpened' : 'Participants.CamClosed'));
      return;
    }
    if (isCamOn) {
      if (notify(await closeRemoteDevice(participant, DeviceType.Camera))) {
        return;
      }
      TUIToast.success(t('Participants.CamStopDone', { name: displayName }));
      return;
    }
    if (notify(await inviteRemoteDevice(participant, DeviceType.Camera))) {
      return;
    }
    TUIToast.success(t('Participants.CamRequested', { name: displayName }));
  }

  async function confirmRename(nameCard: string): Promise<boolean> {
    const next = nameCard.trim();
    if (!next) {
      return false;
    }
    if (notify(await renameParticipant(participant, next))) {
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
        if (notify(await setParticipantAdmin(participant))) {
          return;
        }
        TUIToast.success(t('Participants.SetAdminDone', { name: displayName }));
        return;
      case 'revoke-admin':
        if (notify(await revokeParticipantAdmin(participant))) {
          return;
        }
        TUIToast.success(t('Participants.RevokeAdminDone', { name: displayName }));
        return;
      case 'chat': {
        const disable = !participant.isMessageDisabled;
        if (notify(await setChatDisabled(participant, disable))) {
          return;
        }
        TUIToast.success(t(
          disable ? 'Participants.ChatMuted' : 'Participants.ChatUnmuted',
          { name: displayName },
        ));
        return;
      }
      case 'transfer': {
        const confirmed = await TUIMessageBox.confirm({
          title: t('Participants.TransferOwner'),
          message: t('Participants.TransferOwnerMessage', { name: displayName }),
          confirmText: t('Participants.TransferOwnerConfirm'),
          cancelText: t('Participants.Cancel'),
        });
        if (!confirmed) {
          return;
        }
        if (notify(await transferRoomOwner(participant))) {
          return;
        }
        TUIToast.success(t('Participants.TransferOwnerDone', { name: displayName }));
        return;
      }
      case 'kick': {
        const confirmed = await TUIMessageBox.confirm({
          title: t('Participants.Kick'),
          message: t('Participants.KickMessage', { name: displayName }),
          confirmText: t('Participants.KickConfirm'),
          cancelText: t('Participants.Cancel'),
        });
        if (!confirmed) {
          return;
        }
        if (notify(await kickParticipant(participant))) {
          return;
        }
        TUIToast.success(t('Participants.KickDone', { name: displayName }));
        break;
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
