import { useMemo } from 'react';
import {
  IconAllMembersShareScreen,
  IconHostShareScreen,
  MessageBox,
  Toast,
  i18next,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import {
  useRoomParticipantState,
  useRoomState,
  DeviceType,
  RoomParticipantRole,
  RoomType,
} from 'tuikit-atomicx-react/room';
import type { ActionItem } from '../useParticipantAction';

const { t } = i18next;

function confirm(options: {
  title: string;
  content: string;
  confirmText?: string;
  onConfirm: () => void;
}) {
  MessageBox.alert({
    title: options.title,
    content: options.content,
    confirmText: options.confirmText ?? t('ParticipantList.Confirm'),
    cancelText: t('ParticipantList.Cancel'),
    callback: (action) => {
      if (action === 'confirm') {
        options.onConfirm();
      }
    },
  });
}

export function useRoomActions(): {
  canOperate: boolean;
  roomActionList: ActionItem[];
} {
  const { language } = useUIKit();
  const { localParticipant, participantWithScreen, disableAllDevices } = useRoomParticipantState();
  const { currentRoom } = useRoomState();

  const canOperate
    = localParticipant?.role === RoomParticipantRole.Owner
      || localParticipant?.role === RoomParticipantRole.Admin;

  const isWebinar = currentRoom?.roomType === RoomType.Webinar;

  const roomActionList = useMemo<ActionItem[]>(() => {
    if (!canOperate) {
      return [];
    }

    const audioAction: ActionItem = {
      key: 'RoomAudioAction',
      label: currentRoom?.isAllMicrophoneDisabled
        ? t('ParticipantList.UnmuteAll')
        : t('ParticipantList.MuteAll'),
      handler: () => {
        const willDisable = !currentRoom?.isAllMicrophoneDisabled;
        const title = willDisable
          ? t('ParticipantList.MuteAllTip')
          : t('ParticipantList.UnmuteAll');
        const content = willDisable
          ? t('ParticipantList.MicDisabledTip')
          : t('ParticipantList.UnmuteAllDesc');
        confirm({
          title,
          content,
          confirmText: willDisable ? t('ParticipantList.MuteAll') : t('ParticipantList.ConfirmUnlock'),
          onConfirm: async () => {
            if (currentRoom?.isAllMicrophoneDisabled === willDisable) {
              Toast.success({
                message: willDisable ? t('ParticipantList.AudioDisabled') : t('ParticipantList.AudioEnabled'),
              });
              return;
            }
            await disableAllDevices({ deviceType: DeviceType.Microphone, disable: willDisable });
          },
        });
      },
    };

    if (isWebinar) {
      return [audioAction];
    }

    const videoAction: ActionItem = {
      key: 'AllVideoAction',
      label: currentRoom?.isAllCameraDisabled
        ? t('ParticipantList.EnableAllVideo')
        : t('ParticipantList.DisableAllVideo'),
      handler: () => {
        const willDisable = !currentRoom?.isAllCameraDisabled;
        const title = willDisable
          ? t('ParticipantList.DisableAllVideoTip')
          : t('ParticipantList.EnableAllVideo');
        const content = willDisable
          ? t('ParticipantList.CameraDisabledTip')
          : t('ParticipantList.EnableAllVideoDesc');
        confirm({
          title,
          content,
          confirmText: willDisable ? t('ParticipantList.DisableAllVideo') : t('ParticipantList.ConfirmUnlock'),
          onConfirm: async () => {
            if (currentRoom?.isAllCameraDisabled === willDisable) {
              Toast.success({
                message: willDisable ? t('ParticipantList.VideoDisabled') : t('ParticipantList.VideoEnabled'),
              });
              return;
            }
            await disableAllDevices({ deviceType: DeviceType.Camera, disable: willDisable });
          },
        });
      },
    };

    const screenAction: ActionItem = {
      key: 'AllScreenShareAction',
      icon: currentRoom?.isAllScreenShareDisabled ? IconAllMembersShareScreen : IconHostShareScreen,
      label: currentRoom?.isAllScreenShareDisabled
        ? t('ParticipantList.AllCanShare')
        : t('ParticipantList.HostAdminOnlyShare'),
      handler: () => {
        const willDisable = !currentRoom?.isAllScreenShareDisabled;
        if (
          willDisable
          && participantWithScreen
          && participantWithScreen.role === RoomParticipantRole.GeneralUser
        ) {
          confirm({
            title: t('ParticipantList.ConfirmHostAdminOnlyShare'),
            content: t('ParticipantList.TerminateOtherShare'),
            onConfirm: () => {
              disableAllDevices({ deviceType: DeviceType.ScreenShare, disable: willDisable });
            },
          });
          return;
        }
        disableAllDevices({ deviceType: DeviceType.ScreenShare, disable: willDisable });
      },
    };

    return [audioAction, videoAction, screenAction];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    language,
    canOperate,
    isWebinar,
    currentRoom?.isAllMicrophoneDisabled,
    currentRoom?.isAllCameraDisabled,
    currentRoom?.isAllScreenShareDisabled,
    participantWithScreen?.userId,
  ]);

  return { canOperate, roomActionList };
}
