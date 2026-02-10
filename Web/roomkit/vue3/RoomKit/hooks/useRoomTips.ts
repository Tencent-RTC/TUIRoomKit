import { onMounted, onUnmounted } from 'vue';
import { TUIToast, useUIKit, TUIMessageBox } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState, RoomParticipantEvent, KickedOutOfRoomReason, DeviceType, RoomEvent, useRoomState } from 'tuikit-atomicx-vue3/room';
import type { MessageBoxHandle } from '@tencentcloud/uikit-base-component-vue3';
import type { RoomUser, DeviceRequestInfo } from 'tuikit-atomicx-vue3/room';

export function useRoomTips() {
  const { t } = useUIKit();
  const { subscribeEvent: subscribeRoomEvent, unsubscribeEvent: unsubscribeRoomEvent } = useRoomState();
  const {
    localParticipant,
    muteParticipantMessage,
    approveOpenDeviceRequest,
    rejectOpenDeviceRequest,
    subscribeEvent,
    unsubscribeEvent,
  } = useRoomParticipantState();

  async function onOwnerChanged({ newOwner }: { newOwner: RoomUser }) {
    if (newOwner.userId === localParticipant.value?.userId) {
      TUIToast.success({
        message: t('RoomNotifications.BecomeOwner'),
      });
    }
    if (localParticipant.value?.isMessageDisabled) {
      await muteParticipantMessage({
        userId: newOwner.userId,
        mute: false,
      });
    }
  }

  async function onAdminSet({ userInfo }: { userInfo: RoomUser }) {
    if (userInfo.userId === localParticipant.value?.userId) {
      TUIToast.success({
        message: t('RoomNotifications.BecomeAdmin'),
      });
    }
  }

  function onAdminRevoked({ userInfo }: { userInfo: RoomUser }) {
    if (userInfo.userId === localParticipant.value?.userId) {
      TUIToast.warning({
        message: t('RoomNotifications.AdminRevoked'),
      });
    }
  }

  function onKickedFromRoom({ reason }: { reason: KickedOutOfRoomReason; message: string }) {
    let notice = '';
    switch (reason) {
      case KickedOutOfRoomReason.KickedByAdmin:
        notice = t('RoomNotifications.KickedByAdmin');
        break;
      case KickedOutOfRoomReason.ReplacedByAnotherDevice:
        notice = t('RoomNotifications.ReplacedByAnotherDevice');
        break;
      case KickedOutOfRoomReason.KickedByServer:
        notice = t('RoomNotifications.KickedByServer');
        break;
      case KickedOutOfRoomReason.ConnectionTimeout:
        notice = t('RoomNotifications.ConnectionTimeout');
        break;
      case KickedOutOfRoomReason.InvalidStatusOnReconnect:
        notice = t('RoomNotifications.InvalidStatusOnReconnect');
        break;
      case KickedOutOfRoomReason.RoomLimitExceeded:
        notice = t('RoomNotifications.RoomLimitExceeded');
        break;
      default:
        notice = t('RoomNotifications.DefaultKickedOut');
        break;
    }
    TUIMessageBox.alert({
      title: t('RoomCommon.Notification'),
      content: notice,
    });
  }

  function onParticipantDeviceClosed({ device }: { device: DeviceType; operator: RoomUser }) {
    if (device === DeviceType.Microphone) {
      TUIToast.warning({
        message: t('RoomNotifications.MicrophoneClosed'),
      });
    }
    if (device === DeviceType.Camera) {
      TUIToast.warning({
        message: t('RoomNotifications.CameraClosed'),
      });
    }
    if (device === DeviceType.ScreenShare) {
      TUIToast.warning({
        message: t('RoomNotifications.ScreenShareClosed'),
      });
    }
  }

  function onParticipantMessageMuted({ muted }: { muted: boolean; operator: RoomUser }) {
    TUIToast.warning({
      message: muted
        ? t('RoomNotifications.MessageMuted')
        : t('RoomNotifications.MessageUnmuted'),
    });
  }

  function onAllDevicesDisabled({ device, disable }: { device: DeviceType; disable: boolean; operator: RoomUser }) {
    switch (device) {
      case DeviceType.Microphone:
        TUIToast.warning({
          message: disable
            ? t('RoomNotifications.AllMicrophonesDisabled')
            : t('RoomNotifications.AllMicrophonesEnabled'),
        });
        break;
      case DeviceType.Camera:
        TUIToast.warning({
          message: disable
            ? t('RoomNotifications.AllCamerasDisabled')
            : t('RoomNotifications.AllCamerasEnabled'),
        });
        break;
      case DeviceType.ScreenShare:
        TUIToast.warning({
          message: disable
            ? t('RoomNotifications.AllScreenSharesDisabled')
            : t('RoomNotifications.AllScreenSharesEnabled'),
        });
        break;
      default:
        break;
    }
  }

  function onAllMessagesDisabled({ disable }: { disable: boolean; operator: RoomUser }) {
    TUIToast.warning({
      message: disable
        ? t('RoomNotifications.AllMessagesDisabled')
        : t('RoomNotifications.AllMessagesEnabled'),
    });
  }

  const messageBoxMap: Map<string, MessageBoxHandle> = new Map();
  function onDeviceInvitationReceived({ invitation }: { invitation: DeviceRequestInfo }) {
    const { deviceType, senderUserId, senderNameCard, senderUserName } = invitation;
    const senderName = senderNameCard || senderUserName || senderUserId;
    let content = '';
    let confirmText = '';
    switch (deviceType) {
      case DeviceType.Microphone:
        content = t('RoomNotifications.MicrophoneInvitationReceived', { senderName });
        confirmText = t('RoomNotifications.OpenMicrophone');
        break;
      case DeviceType.Camera:
        content = t('RoomNotifications.CameraInvitationReceived', { senderName });
        confirmText = t('RoomNotifications.OpenCamera');
        break;
      case DeviceType.ScreenShare:
        content = t('RoomNotifications.ScreenShareInvitationReceived', { senderName });
        confirmText = t('RoomNotifications.OpenScreenShare');
        break;
      default:
        break;
    }
    const messageBox = TUIMessageBox.confirm({
      title: t('RoomCommon.Notification'),
      modal: false,
      showClose: false,
      content,
      confirmText,
      cancelText: t('RoomNotifications.KeepOff'),
      callback: async (action) => {
        if (action === 'confirm') {
          await approveOpenDeviceRequest({ device: deviceType, userId: senderUserId });
        }
        if (action === 'cancel') {
          await rejectOpenDeviceRequest({ device: deviceType, userId: senderUserId });
        }
        messageBoxMap.delete(`${deviceType}-${senderUserId}`);
      },
    });
    messageBoxMap.set(`${deviceType}-${senderUserId}`, messageBox);
  }

  function onDeviceInvitationCancelled({ invitation }: { invitation: DeviceRequestInfo }) {
    const { deviceType, senderUserId } = invitation;
    const messageBox = messageBoxMap.get(`${deviceType}-${senderUserId}`);
    if (messageBox) {
      messageBox.close();
      messageBoxMap.delete(`${deviceType}-${senderUserId}`);
    }
  }

  function onDeviceInvitationTimeout({ invitation }: { invitation: DeviceRequestInfo }) {
    const { deviceType, senderUserId } = invitation;
    const messageBox = messageBoxMap.get(`${deviceType}-${senderUserId}`);
    if (messageBox) {
      messageBox.close();
      messageBoxMap.delete(`${deviceType}-${senderUserId}`);
    }
  }

  function onRoomEnded() {
    TUIMessageBox.alert({
      type: 'info',
      title: t('Room.Notify'),
      showClose: false,
      modal: false,
      content: t('Room.RoomEnded'),
    });
  }

  onMounted(() => {
    subscribeEvent(RoomParticipantEvent.onOwnerChanged, onOwnerChanged);
    subscribeEvent(RoomParticipantEvent.onAdminSet, onAdminSet);
    subscribeEvent(RoomParticipantEvent.onAdminRevoked, onAdminRevoked);
    subscribeEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom);
    subscribeEvent(RoomParticipantEvent.onParticipantDeviceClosed, onParticipantDeviceClosed);
    subscribeEvent(RoomParticipantEvent.onParticipantMessageMuted, onParticipantMessageMuted);
    subscribeEvent(RoomParticipantEvent.onAllDevicesDisabled, onAllDevicesDisabled);
    subscribeEvent(RoomParticipantEvent.onAllMessagesDisabled, onAllMessagesDisabled);
    subscribeEvent(RoomParticipantEvent.onDeviceInvitationReceived, onDeviceInvitationReceived);
    subscribeEvent(RoomParticipantEvent.onDeviceInvitationCancelled, onDeviceInvitationCancelled);
    subscribeEvent(RoomParticipantEvent.onDeviceInvitationTimeout, onDeviceInvitationTimeout);
    subscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
  });

  onUnmounted(() => {
    unsubscribeEvent(RoomParticipantEvent.onOwnerChanged, onOwnerChanged);
    unsubscribeEvent(RoomParticipantEvent.onAdminSet, onAdminSet);
    unsubscribeEvent(RoomParticipantEvent.onAdminRevoked, onAdminRevoked);
    unsubscribeEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom);
    unsubscribeEvent(RoomParticipantEvent.onParticipantDeviceClosed, onParticipantDeviceClosed);
    unsubscribeEvent(RoomParticipantEvent.onParticipantMessageMuted, onParticipantMessageMuted);
    unsubscribeEvent(RoomParticipantEvent.onAllDevicesDisabled, onAllDevicesDisabled);
    unsubscribeEvent(RoomParticipantEvent.onAllMessagesDisabled, onAllMessagesDisabled);
    unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationReceived, onDeviceInvitationReceived);
    unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationCancelled, onDeviceInvitationCancelled);
    unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationTimeout, onDeviceInvitationTimeout);
    unsubscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
  });
}
