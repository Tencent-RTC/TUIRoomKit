import { useEffect, useRef } from 'react';
import {
  TUIToast,
  useUIKit,
  TUIMessageBox,
  TOAST_TYPE,
} from '@tencentcloud/uikit-base-component-react';
import {
  useRoomParticipantState,
  RoomParticipantEvent,
  KickedOutOfRoomReason,
  DeviceType,
  RoomEvent,
  useRoomState,
  RoomType,
} from 'tuikit-atomicx-react/room';
import type { MessageBoxHandle } from '@tencentcloud/uikit-base-component-react';
import type { RoomUser, DeviceRequestInfo } from 'tuikit-atomicx-react/room';

export function useRoomTips() {
  const { t } = useUIKit();
  const {
    currentRoom,
    subscribeEvent: subscribeRoomEvent,
    unsubscribeEvent: unsubscribeRoomEvent,
  } = useRoomState();
  const {
    localParticipant,
    disableUserMessage,
    approveOpenDeviceRequest,
    rejectOpenDeviceRequest,
    subscribeEvent,
    unsubscribeEvent,
  } = useRoomParticipantState();

  const tRef = useRef(t);
  tRef.current = t;
  const currentRoomRef = useRef(currentRoom);
  currentRoomRef.current = currentRoom;
  const localParticipantRef = useRef(localParticipant);
  localParticipantRef.current = localParticipant;
  const localIsMessageDisabledRef = useRef(localParticipant?.isMessageDisabled);
  localIsMessageDisabledRef.current = localParticipant?.isMessageDisabled;

  useEffect(() => {
    // Keyed map of currently-shown invitation message boxes so we can close
    // them when the inviter cancels or the request times out.
    const messageBoxMap: Map<string, MessageBoxHandle> = new Map();

    const onOwnerChanged = async ({ newOwner }: { newOwner: RoomUser }) => {
      if (newOwner.userId === localParticipantRef.current?.userId) {
        TUIToast.info({
          message: tRef.current('RoomNotifications.BecomeOwner'),
        });
      }
      if (localParticipantRef.current?.userId === newOwner.userId && localIsMessageDisabledRef.current) {
        await disableUserMessage({
          userId: newOwner.userId,
          disable: false,
        });
      }
    };

    const onAdminSet = ({ userInfo }: { userInfo: RoomUser }) => {
      if (userInfo.userId === localParticipantRef.current?.userId) {
        TUIToast.info({
          message: tRef.current('RoomNotifications.BecomeAdmin'),
        });
      }
    };

    const onAdminRevoked = ({ userInfo }: { userInfo: RoomUser }) => {
      if (userInfo.userId === localParticipantRef.current?.userId) {
        TUIToast.info({
          message: tRef.current('RoomNotifications.AdminRevoked'),
        });
      }
    };

    const onKickedFromRoom = ({
      reason,
    }: {
      reason: KickedOutOfRoomReason;
      message: string;
    }) => {
      let notice = '';
      switch (reason) {
        case KickedOutOfRoomReason.KickedByAdmin:
          notice = tRef.current('RoomNotifications.KickedByAdmin');
          break;
        case KickedOutOfRoomReason.ReplacedByAnotherDevice:
          notice = tRef.current('RoomNotifications.ReplacedByAnotherDevice');
          break;
        case KickedOutOfRoomReason.KickedByServer:
          notice = tRef.current('RoomNotifications.KickedByServer');
          break;
        case KickedOutOfRoomReason.ConnectionTimeout:
          notice = tRef.current('RoomNotifications.ConnectionTimeout');
          break;
        case KickedOutOfRoomReason.InvalidStatusOnReconnect:
          notice = tRef.current('RoomNotifications.InvalidStatusOnReconnect');
          break;
        case KickedOutOfRoomReason.RoomLimitExceeded:
          notice = tRef.current('RoomNotifications.RoomLimitExceeded');
          break;
        default:
          notice = tRef.current('RoomNotifications.DefaultKickedOut');
          break;
      }
      TUIMessageBox.alert({
        title: tRef.current('RoomCommon.Notification'),
        content: notice,
      });
    };

    const onParticipantDeviceClosed = ({
      device,
      operator,
    }: {
      device: DeviceType;
      operator: RoomUser;
    }) => {
      const operatorName = operator.userName || operator.userId;
      if (device === DeviceType.Microphone) {
        TUIToast.warning({
          message: tRef.current('RoomNotifications.MicrophoneClosed', {
            operatorName,
          }),
        });
      }
      if (device === DeviceType.Camera) {
        TUIToast.warning({
          message: tRef.current('RoomNotifications.CameraClosed', {
            operatorName,
          }),
        });
      }
      if (device === DeviceType.ScreenShare) {
        TUIToast.warning({
          message: tRef.current('RoomNotifications.ScreenShareClosed', {
            operatorName,
          }),
        });
      }
    };

    const onParticipantMessageMuted = ({
      muted,
    }: {
      muted: boolean;
      operator: RoomUser;
    }) => {
      TUIToast({
        type: muted ? TOAST_TYPE.WARNING : TOAST_TYPE.INFO,
        message: muted
          ? tRef.current('RoomNotifications.MessageMuted')
          : tRef.current('RoomNotifications.MessageUnmuted'),
      });
    };

    const onAllDevicesDisabled = ({
      device,
      disable,
    }: {
      device: DeviceType;
      disable: boolean;
      operator: RoomUser;
    }) => {
      switch (device) {
        case DeviceType.Microphone:
          TUIToast({
            type: disable ? TOAST_TYPE.WARNING : TOAST_TYPE.INFO,
            message: disable
              ? tRef.current('RoomNotifications.AllMicrophonesDisabled')
              : tRef.current('RoomNotifications.AllMicrophonesEnabled'),
          });
          break;
        case DeviceType.Camera:
          TUIToast({
            type: disable ? TOAST_TYPE.WARNING : TOAST_TYPE.INFO,
            message: disable
              ? tRef.current('RoomNotifications.AllCamerasDisabled')
              : tRef.current('RoomNotifications.AllCamerasEnabled'),
          });
          break;
        case DeviceType.ScreenShare:
          TUIToast({
            type: disable ? TOAST_TYPE.WARNING : TOAST_TYPE.INFO,
            message: disable
              ? tRef.current('RoomNotifications.AllScreenSharesDisabled')
              : tRef.current('RoomNotifications.AllScreenSharesEnabled'),
          });
          break;
        default:
          break;
      }
    };

    const onAllMessagesDisabled = ({
      disable,
    }: {
      disable: boolean;
      operator: RoomUser;
    }) => {
      TUIToast({
        type: disable ? TOAST_TYPE.WARNING : TOAST_TYPE.INFO,
        message: disable
          ? tRef.current('RoomNotifications.AllMessagesDisabled')
          : tRef.current('RoomNotifications.AllMessagesEnabled'),
      });
    };

    const onDeviceInvitationReceived = ({
      invitation,
    }: {
      invitation: DeviceRequestInfo;
    }) => {
      const { deviceType, senderUserId, senderNameCard, senderUserName }
        = invitation;
      const senderName = senderNameCard || senderUserName || senderUserId;
      let content = '';
      let confirmText = '';
      switch (deviceType) {
        case DeviceType.Microphone:
          content = tRef.current('RoomNotifications.MicrophoneInvitationReceived', {
            senderName,
          });
          confirmText = tRef.current('RoomNotifications.OpenMicrophone');
          break;
        case DeviceType.Camera:
          content = tRef.current('RoomNotifications.CameraInvitationReceived', {
            senderName,
          });
          confirmText = tRef.current('RoomNotifications.OpenCamera');
          break;
        case DeviceType.ScreenShare:
          content = tRef.current('RoomNotifications.ScreenShareInvitationReceived', {
            senderName,
          });
          confirmText = tRef.current('RoomNotifications.OpenScreenShare');
          break;
        default:
          break;
      }
      const messageBox = TUIMessageBox.confirm({
        title: tRef.current('RoomCommon.Notification'),
        modal: false,
        showClose: false,
        content,
        confirmText,
        cancelText: tRef.current('RoomNotifications.KeepOff'),
        callback: async (action) => {
          if (action === 'confirm') {
            await approveOpenDeviceRequest({
              device: deviceType,
              userId: senderUserId,
            });
          }
          if (action === 'cancel') {
            await rejectOpenDeviceRequest({
              device: deviceType,
              userId: senderUserId,
            });
          }
          messageBoxMap.delete(`${deviceType}-${senderUserId}`);
        },
      });
      messageBoxMap.set(`${deviceType}-${senderUserId}`, messageBox);
    };

    const onDeviceRequestRejected = ({
      request,
    }: {
      request: DeviceRequestInfo;
    }) => {
      const { deviceType } = request;
      if (currentRoomRef.current?.roomType === RoomType.Webinar) {
        TUIToast.warning({
          message: tRef.current('RoomNotifications.RaiseHandsRequestRejected'),
        });
        return;
      }
      switch (deviceType) {
        case DeviceType.Microphone:
          TUIToast.warning({
            message: tRef.current('RoomNotifications.DeviceRequestRejected', {
              deviceType: tRef.current('RoomNotifications.Microphone'),
            }),
          });
          break;
        case DeviceType.Camera:
          TUIToast.warning({
            message: tRef.current('RoomNotifications.DeviceRequestRejected', {
              deviceType: tRef.current('RoomNotifications.Camera'),
            }),
          });
          break;
        case DeviceType.ScreenShare:
          TUIToast.warning({
            message: tRef.current('RoomNotifications.DeviceRequestRejected', {
              deviceType: tRef.current('RoomNotifications.ScreenShare'),
            }),
          });
          break;
        default:
          break;
      }
    };

    const onDeviceInvitationCancelled = ({
      invitation,
    }: {
      invitation: DeviceRequestInfo;
    }) => {
      const { deviceType, senderUserId } = invitation;
      const messageBox = messageBoxMap.get(`${deviceType}-${senderUserId}`);
      if (messageBox) {
        messageBox.close();
        messageBoxMap.delete(`${deviceType}-${senderUserId}`);
      }
    };

    const onDeviceInvitationTimeout = ({
      invitation,
    }: {
      invitation: DeviceRequestInfo;
    }) => {
      const { deviceType, senderUserId } = invitation;
      const messageBox = messageBoxMap.get(`${deviceType}-${senderUserId}`);
      if (messageBox) {
        messageBox.close();
        messageBoxMap.delete(`${deviceType}-${senderUserId}`);
      }
    };

    const onAudiencePromotedToParticipant = ({
      userInfo,
    }: {
      userInfo: RoomUser;
    }) => {
      if (userInfo.userId === localParticipantRef.current?.userId) {
        TUIToast.info({
          message: tRef.current('RoomNotifications.YouArePromotedToParticipant'),
        });
        return;
      }
      TUIToast.info({
        message: tRef.current('RoomNotifications.AudiencePromotedToParticipant', {
          userName: userInfo.userName || userInfo.userId,
        }),
      });
    };

    const onParticipantDemotedToAudience = (_payload: { userInfo: RoomUser }) => {
      // Intentionally left blank; Vue3 sibling keeps this disabled too. Kept as
      // a placeholder so the event subscription/cleanup pair stays symmetric.
    };

    const onRoomEnded = () => {
      TUIMessageBox.alert({
        type: 'info',
        title: tRef.current('Room.Notify'),
        showClose: false,
        modal: false,
        content: tRef.current('Room.RoomEnded'),
      });
    };

    subscribeEvent(RoomParticipantEvent.onOwnerChanged, onOwnerChanged);
    subscribeEvent(RoomParticipantEvent.onAdminSet, onAdminSet);
    subscribeEvent(RoomParticipantEvent.onAdminRevoked, onAdminRevoked);
    subscribeEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom);
    subscribeEvent(
      RoomParticipantEvent.onParticipantDeviceClosed,
      onParticipantDeviceClosed,
    );
    subscribeEvent(
      RoomParticipantEvent.onParticipantMessageMuted,
      onParticipantMessageMuted,
    );
    subscribeEvent(
      RoomParticipantEvent.onAllDevicesDisabled,
      onAllDevicesDisabled,
    );
    subscribeEvent(
      RoomParticipantEvent.onAllMessagesDisabled,
      onAllMessagesDisabled,
    );
    subscribeEvent(
      RoomParticipantEvent.onDeviceInvitationReceived,
      onDeviceInvitationReceived,
    );
    subscribeEvent(
      RoomParticipantEvent.onDeviceRequestRejected,
      onDeviceRequestRejected,
    );
    subscribeEvent(
      RoomParticipantEvent.onDeviceInvitationCancelled,
      onDeviceInvitationCancelled,
    );
    subscribeEvent(
      RoomParticipantEvent.onDeviceInvitationTimeout,
      onDeviceInvitationTimeout,
    );
    subscribeEvent(
      RoomParticipantEvent.onAudiencePromotedToParticipant,
      onAudiencePromotedToParticipant,
    );
    subscribeEvent(
      RoomParticipantEvent.onParticipantDemotedToAudience,
      onParticipantDemotedToAudience,
    );
    subscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);

    return () => {
      unsubscribeEvent(RoomParticipantEvent.onOwnerChanged, onOwnerChanged);
      unsubscribeEvent(RoomParticipantEvent.onAdminSet, onAdminSet);
      unsubscribeEvent(RoomParticipantEvent.onAdminRevoked, onAdminRevoked);
      unsubscribeEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom);
      unsubscribeEvent(
        RoomParticipantEvent.onParticipantDeviceClosed,
        onParticipantDeviceClosed,
      );
      unsubscribeEvent(
        RoomParticipantEvent.onParticipantMessageMuted,
        onParticipantMessageMuted,
      );
      unsubscribeEvent(
        RoomParticipantEvent.onAllDevicesDisabled,
        onAllDevicesDisabled,
      );
      unsubscribeEvent(
        RoomParticipantEvent.onAllMessagesDisabled,
        onAllMessagesDisabled,
      );
      unsubscribeEvent(
        RoomParticipantEvent.onDeviceInvitationReceived,
        onDeviceInvitationReceived,
      );
      unsubscribeEvent(
        RoomParticipantEvent.onDeviceRequestRejected,
        onDeviceRequestRejected,
      );
      unsubscribeEvent(
        RoomParticipantEvent.onDeviceInvitationCancelled,
        onDeviceInvitationCancelled,
      );
      unsubscribeEvent(
        RoomParticipantEvent.onDeviceInvitationTimeout,
        onDeviceInvitationTimeout,
      );
      unsubscribeEvent(
        RoomParticipantEvent.onAudiencePromotedToParticipant,
        onAudiencePromotedToParticipant,
      );
      unsubscribeEvent(
        RoomParticipantEvent.onParticipantDemotedToAudience,
        onParticipantDemotedToAudience,
      );
      unsubscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
      messageBoxMap.forEach(box => box.close());
      messageBoxMap.clear();
    };
  }, [
    subscribeEvent,
    unsubscribeEvent,
    subscribeRoomEvent,
    unsubscribeRoomEvent,
    disableUserMessage,
    approveOpenDeviceRequest,
    rejectOpenDeviceRequest,
  ]);
}
