import { ref, computed } from 'vue';
import { TUIRole } from '@tencentcloud/tuiroom-engine-js';
import { UserInfo } from '../../../../stores/room';
import { useI18n } from '../../../../locales';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { MESSAGE_DURATION } from '../../../../constants/message';
import { roomService } from '../../../../services';
import { useUserState, useRoomState } from '../../../hooks';
import { RoomAction } from '../../../type';

export default function useIndex() {
  const { t } = useI18n();

  const { localUser, userList } = useUserState();
  const isGeneralUser = computed(
    () => localUser.value?.userRole === TUIRole.kGeneralUser
  );

  const { useRoomActions } = useRoomState();
  const [roomAudioAction, roomVideoAction, roomScreenAction] = useRoomActions({
    actionList: [
      RoomAction.AudioAction,
      RoomAction.VideoAction,
      RoomAction.ScreenAction,
    ],
  });
  const moreControlList = computed(() => [roomScreenAction]);

  const showMoreControl = ref(false);
  function toggleClickMoreBtn() {
    showMoreControl.value = !showMoreControl.value;
  }

  const handleCallAllInvitee = () => {
    const userIdList = userList.value
      .filter((item: UserInfo) => !item.isInRoom)
      .map((item: UserInfo) => item.userId);
    roomService.conferenceInvitationManager.inviteUsers({ userIdList });
    TUIToast({
      type: TOAST_TYPE.SUCCESS,
      message: t('Invitation sent, waiting for members to join.'),
      duration: MESSAGE_DURATION.NORMAL,
    });
  };

  return {
    t,
    toggleClickMoreBtn,
    isGeneralUser,
    showMoreControl,
    roomAudioAction,
    roomVideoAction,
    moreControlList,
    handleCallAllInvitee,
  };
}
