import { computed, defineComponent, reactive, watch } from 'vue';
import { TUIInvitationStatus } from '@tencentcloud/tuiroom-engine-js';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { MESSAGE_DURATION } from '../../../../constants/message';
import { useI18n } from '../../../../locales';
import { roomService } from '../../../../services';
import { UserInfo, UserAction, ActionType } from '../../../type';

const { t } = useI18n();

export default function useMemberInviteAction(
  userInfo: UserInfo
): ActionType<UserAction> {
  const handleInvite = () => {
    roomService.conferenceInvitationManager.inviteUsers({
      userIdList: [userInfo.userId],
    });
    TUIToast({
      type: TOAST_TYPE.SUCCESS,
      message: t('Invitation sent, waiting for members to join.'),
      duration: MESSAGE_DURATION.NORMAL,
    });
  };

  const invitationStatus = computed(() => userInfo.invitationStatus);

  const inviteControl = reactive({
    key: UserAction.InviteEnterRoomAction,
    type: 'control',
    label: t('Call'),
    handler: handleInvite,
  });

  watch(invitationStatus, newVal => {
    if (newVal === TUIInvitationStatus.kPending) {
      inviteControl.label = t('Calling...');
      inviteControl.type = 'info';
      inviteControl.handler = () => {};
    }
    if (newVal === TUIInvitationStatus.kRejected) {
      inviteControl.label = t('Not joining for now');
      inviteControl.type = 'info';
      inviteControl.handler = () => {};
      setTimeout(() => {
        inviteControl.label = t('Call');
        inviteControl.type = 'control';
        inviteControl.handler = handleInvite;
      }, 3000);
    }
  });

  return inviteControl;
}
