import type React from 'react';
import { createElement, useMemo } from 'react';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  IconAudioClose,
  IconAudioOpen,
  IconChatForbidden,
  IconEditNameCard,
  IconKickOut,
  IconRevokeAdmin,
  IconSetAdmin,
  IconTransferOwner,
  IconVideoClose,
  IconVideoOpen,
  Dialog,
  Input,
  MessageBox,
  Toast,
  i18next,
} from '@tencentcloud/uikit-base-component-react';
import {
  useRoomParticipantState,
  useRoomState,
  DeviceStatus,
  DeviceType,
  RoomParticipantRole,
  RoomType,
} from 'tuikit-atomicx-react/room';
import type { RoomParticipant, RoomUser } from 'tuikit-atomicx-react/room';

const { t } = i18next;

function calculateByteLength(str: string): number {
  let byteLength = 0;
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) {
      byteLength += 1;
    } else if (code <= 0x7ff) {
      byteLength += 2;
    } else if (code <= 0xffff) {
      byteLength += 3;
    } else {
      byteLength += 4;
    }
  }
  return byteLength;
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined;
  }
  const { code } = error as { code?: number };
  return code;
}

export interface ActionItem {
  key: string;
  label: string;
  handler: () => void;
  icon?: React.ComponentType<{ size?: string; className?: string }>;
  style?: React.CSSProperties;
}

function confirm(options: {
  title: string;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}) {
  MessageBox.alert({
    title: options.title,
    content: options.content,
    confirmText: options.confirmText ?? t('ParticipantList.Confirm'),
    cancelText: options.cancelText ?? t('ParticipantList.Cancel'),
    callback: (action) => {
      if (action === 'confirm') {
        options.onConfirm();
      }
    },
  });
}

export function useParticipantAction({
  targetParticipant,
}: {
  targetParticipant: RoomParticipant;
}): { controlList: ActionItem[] } {
  const {
    localParticipant,
    adminList,
    messageDisabledUserList,
    closeParticipantDevice,
    inviteToOpenDevice,
    kickUser,
    setAdmin,
    revokeAdmin,
    transferOwner,
    updateParticipantNameCard,
    disableUserMessage,
    demoteToAudience,
  } = useRoomParticipantState();
  const { currentRoom } = useRoomState();

  const isWebinar = currentRoom?.roomType === RoomType.Webinar;
  const isLocalOwner = localParticipant?.role === RoomParticipantRole.Owner;
  const isLocalAdmin
    = localParticipant?.role === RoomParticipantRole.Admin
      || adminList.some(admin => admin.userId === localParticipant?.userId);

  const targetIsMe = targetParticipant.userId === localParticipant?.userId;
  const targetIsOwner = targetParticipant.role === RoomParticipantRole.Owner;
  const targetIsAdmin = targetParticipant.role === RoomParticipantRole.Admin;
  const targetIsGeneralUser = targetParticipant.role === RoomParticipantRole.GeneralUser;
  const hasAudio = targetParticipant.microphoneStatus === DeviceStatus.On;
  const hasVideo = targetParticipant.cameraStatus === DeviceStatus.On;
  const isMessageDisabled
    = targetParticipant.isMessageDisabled
      || messageDisabledUserList.some(u => u.userId === targetParticipant.userId);
  const displayName = (targetParticipant as RoomParticipant).nameCard || targetParticipant.userName || targetParticipant.userId;

  const controlList = useMemo<ActionItem[]>(() => {
    const result: ActionItem[] = [];

    // Demote to audience: webinar + (owner targeting non-self, or admin targeting general/self)
    if (isWebinar && ((isLocalOwner && !targetIsMe) || (isLocalAdmin && (targetIsGeneralUser || targetIsMe)))) {
      result.push({
        key: 'demoteToAudience',
        icon: IconRevokeAdmin,
        label: t('ParticipantList.DemoteToAudience'),
        handler: async () => {
          try {
            await demoteToAudience({ userId: targetParticipant.userId });
          } catch (_e) {
            Toast.error({ message: t('ParticipantList.DemoteToAudienceFailed') });
          }
        },
      });
    }

    // Audio control: owner or admin targeting general user, not self
    if ((isLocalOwner || (isLocalAdmin && targetIsGeneralUser)) && !targetIsMe) {
      if (hasAudio) {
        result.push({
          key: 'muteAudio',
          icon: IconAudioOpen,
          label: t('ParticipantList.Mute'),
          handler: async () => {
            await closeParticipantDevice({ userId: targetParticipant.userId, deviceType: DeviceType.Microphone });
          },
        });
      } else {
        result.push({
          key: 'unmuteAudio',
          icon: IconAudioClose,
          label: t('ParticipantList.Unmute'),
          handler: async () => {
            await inviteToOpenDevice({ userId: targetParticipant.userId, device: DeviceType.Microphone, timeout: 30 });
            Toast.info({ message: t('ParticipantList.InviteMicSent', { name: displayName }) });
          },
        });
      }

      // Video control (non-webinar only)
      if (!isWebinar) {
        if (hasVideo) {
          result.push({
            key: 'muteVideo',
            icon: IconVideoOpen,
            label: t('ParticipantList.DisableVideo'),
            handler: async () => {
              await closeParticipantDevice({ userId: targetParticipant.userId, deviceType: DeviceType.Camera });
            },
          });
        } else {
          result.push({
            key: 'unmuteVideo',
            icon: IconVideoClose,
            label: t('ParticipantList.EnableVideo'),
            handler: async () => {
              await inviteToOpenDevice({ userId: targetParticipant.userId, device: DeviceType.Camera, timeout: 30 });
              Toast.info({ message: t('ParticipantList.InviteCameraSent', { name: displayName }) });
            },
          });
        }
      }
    }

    // Transfer owner: non-webinar, local is owner, target is not owner
    if (!isWebinar && isLocalOwner && !targetIsOwner) {
      result.push({
        key: 'transferOwner',
        icon: IconTransferOwner,
        label: t('ParticipantList.TransferHost'),
        handler: () => {
          confirm({
            title: t('ParticipantList.TransferHostTo', { name: displayName }),
            content: t('ParticipantList.TransferHostWarning'),
            confirmText: t('ParticipantList.ConfirmTransfer'),
            onConfirm: () => {
              transferOwner({ userId: targetParticipant.userId })
                .then(() => Toast.success({ message: t('ParticipantList.TransferHostSuccess', { name: displayName }) }))
                .catch(() => Toast.error({ message: t('ParticipantList.TransferHostFailed') }));
            },
          });
        },
      });
    }

    // Set admin: owner + target is general user
    if (isLocalOwner && targetIsGeneralUser) {
      result.push({
        key: 'setAdmin',
        icon: IconSetAdmin,
        label: t('ParticipantList.SetAdmin'),
        handler: async () => {
          try {
            await setAdmin({ userId: targetParticipant.userId });
          } catch (err: unknown) {
            if (getErrorCode(err) === TUIErrorCode.ERR_ADMIN_COUNT_LIMIT) {
              Toast.error({ message: t('ParticipantList.AdminCountLimit') });
              return;
            }
            Toast.error({ message: t('ParticipantList.SetAdminFailed') });
          }
        },
      });
    }

    // Revoke admin: owner + target is admin
    if (isLocalOwner && targetIsAdmin) {
      result.push({
        key: 'revokeAdmin',
        icon: IconRevokeAdmin,
        label: t('ParticipantList.RemoveAdmin'),
        handler: async () => {
          await revokeAdmin({ userId: targetParticipant.userId });
          Toast.success({ message: t('ParticipantList.RemoveAdminSuccess', { name: displayName }) });
        },
      });
    }

    // Change name: non-webinar + (owner, admin targeting general user, or self)
    if (!isWebinar && (isLocalOwner || (isLocalAdmin && targetIsGeneralUser) || targetIsMe)) {
      result.push({
        key: 'changeUserNameCard',
        icon: IconEditNameCard,
        label: t('ParticipantList.ChangeName'),
        handler: () => {
          let inputUserName = displayName;

          const renderChangeNameDialog = () => {
            Dialog.open({
              title: t('ParticipantList.ChangeName'),
              content: createElement(Input, {
                defaultValue: displayName,
                placeholder: t('ParticipantList.InputUserName'),
                onChange: (event) => {
                  inputUserName = event.target.value;
                  renderChangeNameDialog();
                },
              }),
              confirmText: t('ParticipantList.Confirm'),
              cancelText: t('ParticipantList.Cancel'),
              confirmDisabled: !inputUserName.trim(),
              onCancel: Dialog.close,
              onClose: Dialog.close,
              onConfirm: () => {
                if (calculateByteLength(inputUserName) > 32) {
                  Toast.warning({ message: t('ParticipantList.NameMaxLength') });
                  return;
                }
                updateParticipantNameCard({ userId: targetParticipant.userId, nameCard: inputUserName })
                  .then(() => {
                    Toast.success({ message: t('ParticipantList.NameChangeSuccess') });
                    Dialog.close();
                  })
                  .catch(() => Toast.error({ message: t('ParticipantList.ChangeNameFailed') }));
              },
            });
          };

          renderChangeNameDialog();
        },
      });
    }

    // Disable chat: owner targeting general/admin, or admin targeting general user
    if ((isLocalOwner && (targetIsGeneralUser || targetIsAdmin)) || (isLocalAdmin && targetIsGeneralUser)) {
      result.push({
        key: 'chatAction',
        icon: IconChatForbidden,
        label: isMessageDisabled ? t('ParticipantList.EnableChat') : t('ParticipantList.DisableChat'),
        handler: async () => {
          try {
            await disableUserMessage({ userId: targetParticipant.userId, disable: !isMessageDisabled });
          } catch (_e) {
            Toast.error({ message: t('ParticipantList.DisableChatFailed') });
          }
        },
      });
    }

    // Kick out: same permission as disable chat
    if ((isLocalOwner && (targetIsGeneralUser || targetIsAdmin)) || (isLocalAdmin && targetIsGeneralUser)) {
      result.push({
        key: 'kick',
        icon: IconKickOut,
        label: t('ParticipantList.KickOut'),
        style: { color: '#FF0000' },
        handler: () => {
          confirm({
            title: t('ParticipantList.Note'),
            content: t('ParticipantList.ConfirmKick', { name: displayName }),
            onConfirm: () => {
              kickUser({ userId: targetParticipant.userId })
                .catch(() => Toast.error({ message: t('ParticipantList.KickOut') }));
            },
          });
        },
      });
    }

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isWebinar, isLocalOwner, isLocalAdmin, targetIsMe, targetIsOwner, targetIsAdmin,
    targetIsGeneralUser, hasAudio, hasVideo, isMessageDisabled,
    targetParticipant.userId,
  ]);

  return { controlList };
}

export function useAudienceAction({
  targetAudience,
}: {
  targetAudience: RoomUser;
}): { controlList: ActionItem[] } {
  const {
    localParticipant,
    adminList,
    messageDisabledUserList,
    setAdmin,
    revokeAdmin,
    kickUser,
    disableUserMessage,
    promoteToParticipant,
  } = useRoomParticipantState();
  const { currentRoom } = useRoomState();

  const isWebinar = currentRoom?.roomType === RoomType.Webinar;
  const isLocalOwner = localParticipant?.role === RoomParticipantRole.Owner;
  const isLocalAdmin
    = localParticipant?.role === RoomParticipantRole.Admin
      || adminList.some(admin => admin.userId === localParticipant?.userId);

  const targetIsMe = targetAudience.userId === localParticipant?.userId;
  const targetIsAdmin = adminList.some(admin => admin.userId === targetAudience.userId);
  const isMessageDisabled = messageDisabledUserList.some(u => u.userId === targetAudience.userId);

  const controlList = useMemo<ActionItem[]>(() => {
    const result: ActionItem[] = [];

    // Promote to participant: webinar + (owner, or admin who is not owner targeting non-admin or self)
    if (isWebinar && (isLocalOwner || ((isLocalAdmin && !isLocalOwner) && (!targetIsAdmin || targetIsMe)))) {
      result.push({
        key: 'promoteToParticipant',
        icon: IconSetAdmin,
        label: t('ParticipantList.PromoteToParticipant'),
        handler: async () => {
          try {
            await promoteToParticipant({ userId: targetAudience.userId });
          } catch (err: unknown) {
            const code = getErrorCode(err);
            if (code !== undefined) {
              if (code === TUIErrorCode.ERR_ALL_SEAT_OCCUPIED || code === TUIErrorCode.ERR_NO_PERMISSION) {
                Toast.error({ message: t('ParticipantList.ParticipantCountLimit') });
                return;
              }
            }
            Toast.error({ message: t('ParticipantList.PromoteToParticipantFailed') });
          }
        },
      });
    }

    // Set admin: owner + target is not admin and not self
    if (isLocalOwner && !targetIsAdmin && !targetIsMe) {
      result.push({
        key: 'setAdmin',
        icon: IconSetAdmin,
        label: t('ParticipantList.SetAdmin'),
        handler: async () => {
          try {
            await setAdmin({ userId: targetAudience.userId });
          } catch (err: unknown) {
            if (getErrorCode(err) === TUIErrorCode.ERR_ADMIN_COUNT_LIMIT) {
              Toast.error({ message: t('ParticipantList.AdminCountLimit') });
              return;
            }
            Toast.error({ message: t('ParticipantList.SetAdminFailed') });
          }
        },
      });
    }

    // Revoke admin: owner + target is admin
    if (isLocalOwner && targetIsAdmin) {
      result.push({
        key: 'revokeAdmin',
        icon: IconRevokeAdmin,
        label: t('ParticipantList.RemoveAdmin'),
        handler: async () => {
          await revokeAdmin({ userId: targetAudience.userId });
        },
      });
    }

    // Disable chat: not self + (owner or admin targeting non-admin)
    if (!targetIsMe && (isLocalOwner || (isLocalAdmin && !targetIsAdmin))) {
      result.push({
        key: 'chatAction',
        icon: IconChatForbidden,
        label: isMessageDisabled ? t('ParticipantList.EnableChat') : t('ParticipantList.DisableChat'),
        handler: async () => {
          try {
            await disableUserMessage({ userId: targetAudience.userId, disable: !isMessageDisabled });
          } catch (_e) {
            Toast.error({ message: t('ParticipantList.DisableChatFailed') });
          }
        },
      });
    }

    // Kick out
    if (!targetIsMe && (isLocalOwner || (isLocalAdmin && !targetIsAdmin))) {
      result.push({
        key: 'kick',
        icon: IconKickOut,
        label: t('ParticipantList.KickOut'),
        style: { color: '#FF0000' },
        handler: () => {
          const displayName = targetAudience.userName || targetAudience.userId;
          confirm({
            title: t('ParticipantList.Note'),
            content: t('ParticipantList.ConfirmKick', { name: displayName }),
            onConfirm: () => {
              kickUser({ userId: targetAudience.userId })
                .catch(() => Toast.error({ message: t('ParticipantList.KickOut') }));
            },
          });
        },
      });
    }

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isWebinar, isLocalOwner, isLocalAdmin, targetIsMe, targetIsAdmin, isMessageDisabled,
    targetAudience.userId,
  ]);

  return { controlList };
}
