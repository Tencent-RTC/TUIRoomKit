import { watch } from 'vue';
import {
  DeviceType,
  RoomParticipantEvent,
  RoomType,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import type { DeviceRequestInfo, RoomUser } from 'tuikit-atomicx-vue3/room';
import { TUIMessageBox, TUIToast, t } from '../../../base';
import type { MessageBoxHandle } from '../../../base';
import { useRecordingNotice } from '../../../features/Recording/useRecordingNotice';
import { useRoomExit } from './useRoomExit';

/**
 * Show the same remote-side room tips as the legacy Vue RoomKit hook.
 * Wait for a roomId before touching participant state so RoomKit entry
 * does not construct CallEventManager too early.
 */
export function useRoomTips(options: { onLeave: () => void }) {
  const { currentRoom } = useRoomState();
  const { leaveRoom } = useRoomExit();

  // Outside the roomId gate on purpose: recording events come from room state rather
  // than participant state, and someone joining a room that already records is told
  // through an event the SDK replays before the room record lands.
  useRecordingNotice({
    onLeave: async () => {
      await leaveRoom();
      options.onLeave();
    },
  });

  watch(
    () => currentRoom.value?.roomId,
    (roomId, _previousRoomId, onCleanup) => {
      if (!roomId) {
        return;
      }

      const {
        localParticipant,
        disableUserMessage,
        approveOpenDeviceRequest,
        rejectOpenDeviceRequest,
        subscribeEvent,
        unsubscribeEvent,
      } = useRoomParticipantState();

      async function onOwnerChanged({ newOwner }: { newOwner: RoomUser }) {
        if (newOwner.userId === localParticipant.value?.userId) {
          TUIToast.info(t('RoomNotifications.BecomeOwner'));
        }
        if (localParticipant.value?.isMessageDisabled) {
          await disableUserMessage({
            userId: newOwner.userId,
            disable: false,
          });
        }
      }

      function onAdminSet({ userInfo }: { userInfo: RoomUser }) {
        if (userInfo.userId === localParticipant.value?.userId) {
          TUIToast.info(t('RoomNotifications.BecomeAdmin'));
        }
      }

      function onAdminRevoked({ userInfo }: { userInfo: RoomUser }) {
        if (userInfo.userId === localParticipant.value?.userId) {
          TUIToast.info(t('RoomNotifications.AdminRevoked'));
        }
      }

      function onParticipantDeviceClosed({ device, operator }: { device: DeviceType; operator: RoomUser }) {
        const operatorName = operator.userName || operator.userId;
        if (device === DeviceType.Microphone) {
          TUIToast.warning(t('RoomNotifications.MicrophoneClosed', { operatorName }));
        }
        if (device === DeviceType.Camera) {
          TUIToast.warning(t('RoomNotifications.CameraClosed', { operatorName }));
        }
        if (device === DeviceType.ScreenShare) {
          TUIToast.warning(t('RoomNotifications.ScreenShareClosed', { operatorName }));
        }
      }

      function onParticipantMessageMuted({ muted }: { muted: boolean; operator: RoomUser }) {
        TUIToast({
          type: muted ? 'warning' : 'info',
          message: muted
            ? t('RoomNotifications.MessageMuted')
            : t('RoomNotifications.MessageUnmuted'),
        });
      }

      function onAllDevicesDisabled({ device, disable, operator }: { device: DeviceType; disable: boolean; operator: RoomUser }) {
        if (operator.userId === localParticipant.value?.userId) {
          return;
        }
        switch (device) {
          case DeviceType.Microphone:
            TUIToast({
              type: disable ? 'warning' : 'info',
              message: disable
                ? t('RoomNotifications.AllMicrophonesDisabled')
                : t('RoomNotifications.AllMicrophonesEnabled'),
            });
            break;
          case DeviceType.Camera:
            TUIToast({
              type: disable ? 'warning' : 'info',
              message: disable
                ? t('RoomNotifications.AllCamerasDisabled')
                : t('RoomNotifications.AllCamerasEnabled'),
            });
            break;
          case DeviceType.ScreenShare:
            TUIToast({
              type: disable ? 'warning' : 'info',
              message: disable
                ? t('RoomNotifications.AllScreenSharesDisabled')
                : t('RoomNotifications.AllScreenSharesEnabled'),
            });
            break;
          default:
            break;
        }
      }

      function onAllMessagesDisabled({ disable, operator }: { disable: boolean; operator: RoomUser }) {
        if (operator.userId === localParticipant.value?.userId) {
          return;
        }
        TUIToast({
          type: disable ? 'warning' : 'info',
          message: disable
            ? t('RoomNotifications.AllMessagesDisabled')
            : t('RoomNotifications.AllMessagesEnabled'),
        });
      }

      const messageBoxMap = new Map<string, MessageBoxHandle>();

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
        const invitationKey = `${deviceType}-${senderUserId}`;
        const messageBox = TUIMessageBox.confirm({
          title: t('RoomCommon.Notification'),
          message: content,
          closable: false,
          confirmText,
          cancelText: t('RoomNotifications.KeepOff'),
        });
        messageBoxMap.set(invitationKey, messageBox);
        void messageBox.then(async (confirmed) => {
          const stillPending = messageBoxMap.has(invitationKey);
          messageBoxMap.delete(invitationKey);
          if (!stillPending) {
            return;
          }
          if (confirmed) {
            await approveOpenDeviceRequest({ device: deviceType, userId: senderUserId });
            return;
          }
          await rejectOpenDeviceRequest({ device: deviceType, userId: senderUserId });
        });
      }

      function onDeviceRequestRejected({ request }: { request: DeviceRequestInfo }) {
        const { deviceType } = request;
        if (currentRoom.value?.roomType === RoomType.Webinar) {
          TUIToast.warning(t('RoomNotifications.RaiseHandsRequestRejected'));
          return;
        }
        switch (deviceType) {
          case DeviceType.Microphone:
            TUIToast.warning(t('RoomNotifications.DeviceRequestRejected', {
              deviceType: t('RoomNotifications.Microphone'),
            }));
            break;
          case DeviceType.Camera:
            TUIToast.warning(t('RoomNotifications.DeviceRequestRejected', {
              deviceType: t('RoomNotifications.Camera'),
            }));
            break;
          case DeviceType.ScreenShare:
            TUIToast.warning(t('RoomNotifications.DeviceRequestRejected', {
              deviceType: t('RoomNotifications.ScreenShare'),
            }));
            break;
          default:
            break;
        }
      }

      function closeInvitationBox(invitation: DeviceRequestInfo) {
        const invitationKey = `${invitation.deviceType}-${invitation.senderUserId}`;
        const messageBox = messageBoxMap.get(invitationKey);
        if (messageBox) {
          messageBoxMap.delete(invitationKey);
          messageBox.close();
        }
      }

      function onDeviceInvitationCancelled({ invitation }: { invitation: DeviceRequestInfo }) {
        closeInvitationBox(invitation);
      }

      function onDeviceInvitationTimeout({ invitation }: { invitation: DeviceRequestInfo }) {
        closeInvitationBox(invitation);
      }

      function onAudiencePromotedToParticipant({ userInfo }: { userInfo: RoomUser }) {
        if (userInfo.userId === localParticipant.value?.userId) {
          TUIToast.info(t('RoomNotifications.YouArePromotedToParticipant'));
          return;
        }
        TUIToast.info(t('RoomNotifications.AudiencePromotedToParticipant', {
          userName: userInfo.userName || userInfo.userId,
        }));
      }

      function onParticipantDemotedToAudience(_payload: { userInfo: RoomUser }) {
        // Legacy Vue RoomKit keeps this handler empty; do not invent a tip.
      }

      subscribeEvent(RoomParticipantEvent.onOwnerChanged, onOwnerChanged);
      subscribeEvent(RoomParticipantEvent.onAdminSet, onAdminSet);
      subscribeEvent(RoomParticipantEvent.onAdminRevoked, onAdminRevoked);
      subscribeEvent(RoomParticipantEvent.onParticipantDeviceClosed, onParticipantDeviceClosed);
      subscribeEvent(RoomParticipantEvent.onParticipantMessageMuted, onParticipantMessageMuted);
      subscribeEvent(RoomParticipantEvent.onAllDevicesDisabled, onAllDevicesDisabled);
      subscribeEvent(RoomParticipantEvent.onAllMessagesDisabled, onAllMessagesDisabled);
      subscribeEvent(RoomParticipantEvent.onDeviceInvitationReceived, onDeviceInvitationReceived);
      subscribeEvent(RoomParticipantEvent.onDeviceRequestRejected, onDeviceRequestRejected);
      subscribeEvent(RoomParticipantEvent.onDeviceInvitationCancelled, onDeviceInvitationCancelled);
      subscribeEvent(RoomParticipantEvent.onDeviceInvitationTimeout, onDeviceInvitationTimeout);
      subscribeEvent(RoomParticipantEvent.onAudiencePromotedToParticipant, onAudiencePromotedToParticipant);
      subscribeEvent(RoomParticipantEvent.onParticipantDemotedToAudience, onParticipantDemotedToAudience);

      onCleanup(() => {
        unsubscribeEvent(RoomParticipantEvent.onOwnerChanged, onOwnerChanged);
        unsubscribeEvent(RoomParticipantEvent.onAdminSet, onAdminSet);
        unsubscribeEvent(RoomParticipantEvent.onAdminRevoked, onAdminRevoked);
        unsubscribeEvent(RoomParticipantEvent.onParticipantDeviceClosed, onParticipantDeviceClosed);
        unsubscribeEvent(RoomParticipantEvent.onParticipantMessageMuted, onParticipantMessageMuted);
        unsubscribeEvent(RoomParticipantEvent.onAllDevicesDisabled, onAllDevicesDisabled);
        unsubscribeEvent(RoomParticipantEvent.onAllMessagesDisabled, onAllMessagesDisabled);
        unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationReceived, onDeviceInvitationReceived);
        unsubscribeEvent(RoomParticipantEvent.onDeviceRequestRejected, onDeviceRequestRejected);
        unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationCancelled, onDeviceInvitationCancelled);
        unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationTimeout, onDeviceInvitationTimeout);
        unsubscribeEvent(RoomParticipantEvent.onAudiencePromotedToParticipant, onAudiencePromotedToParticipant);
        unsubscribeEvent(RoomParticipantEvent.onParticipantDemotedToAudience, onParticipantDemotedToAudience);
        messageBoxMap.forEach(box => box.close());
        messageBoxMap.clear();
      });
    },
    { immediate: true },
  );
}
