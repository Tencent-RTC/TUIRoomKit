import { computed, ref } from 'vue';
import { useBasicStore } from '../../stores/basic';
import { useRoomStore } from '../../stores/room';
import TUIMessage from '../common/base/Message/index';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import { clipBoard, getUrlWithRoomId } from '../../utils/utils';
import { isElectron } from '../../utils/environment';
import InviteIcon from '../common/icons/InviteIcon.vue';
import ShareIcon from '../common/icons/ShareIcon.vue';
import { roomService, TUIUserInfo } from '../../services';
import { MESSAGE_DURATION } from '../../constants/message';
export default function useRoomInvite() {
  const { t } = useI18n();

  const basicStore = useBasicStore();
  const roomLinkConfig = roomService.getComponentConfig('RoomLink');
  const roomStore = useRoomStore();
  const { remoteEnteredUserList, roomName, isSeatEnabled, password } =
    storeToRefs(roomStore);
  const {
    roomId,
    shareLink,
    isRoomLinkVisible,
    isSchemeLinkVisible,
    userId,
    userName,
  } = storeToRefs(basicStore);

  const { origin, pathname } = location || {};
  const isShowLink = ref(true);

  const showContacts = ref(false);

  const showRoomInvite = ref(false);

  const inviteLink = computed(() => {
    if (shareLink.value) {
      const urlConcatenation = shareLink.value.indexOf('?') !== -1 ? '&' : '?';
      return `${shareLink.value}${urlConcatenation}roomId=${roomId.value}`;
    }
    return `${origin}${pathname}#/home?roomId=${roomId.value}`;
  });
  const schemeLink = computed(
    () => `tuiroom://joinroom?roomId=${roomId.value}`
  );

  const inviteBarTitle = computed(() =>
    isRoomLinkVisible.value
      ? t(
          'You can share the room number or link to invite more people to join the room.'
        )
      : t(
          'You can share the room number to invite more people to join the room'
        )
  );

  const isShowPassword = computed(() => !!password?.value);

  const invitationFeatureDetails = ref([
    {
      icon: InviteIcon,
      text: 'addMember',
      function: async () => {
        contacts.value =
          await roomService.scheduleConferenceManager.fetchFriendList();
        showContacts.value = true;
      },
    },
    {
      icon: ShareIcon,
      text: 'shareRoom',
      function: () => {
        showRoomInvite.value = true;
      },
    },
  ]);

  const contacts = ref([]);

  async function onCopy(value: string | number) {
    try {
      await clipBoard(value);
      TUIMessage({
        message: t('Copied successfully'),
        type: 'success',
      });
    } catch (error) {
      TUIMessage({
        message: t('Copied failure'),
        type: 'error',
      });
    }
  }

  const inviteContentList = computed(() => [
    {
      id: 1,
      mobileTitle: 'Room ID',
      pcTitle: 'Invite by room number',
      content: roomId.value,
      copyLink: roomId.value,
      visible: isShowLink.value,
    },
    {
      id: 2,
      mobileTitle: 'Room Link',
      pcTitle: 'Invite via room link',
      content: inviteLink.value,
      copyLink: inviteLink.value,
      visible: isRoomLinkVisible.value,
    },
    {
      id: 3,
      mobileTitle: 'scheme',
      pcTitle: 'Invite via client scheme',
      content: schemeLink.value,
      copyLink: schemeLink.value,
      visible: isSchemeLinkVisible.value,
    },
  ]);

  const visibleInviteContentList = computed(() =>
    inviteContentList.value.filter(item => item.visible)
  );

  const conferenceInviteList = computed(() => [
    {
      title: 'Room Name',
      content: roomName.value,
      isShowCopyIcon: false,
      isVisible: true,
    },
    {
      title: 'Room Type',
      content: `${t(getSeatModeDisplay(isSeatEnabled.value))}`,
      isShowCopyIcon: false,
      isVisible: true,
    },
    {
      title: 'Room ID',
      content: roomId.value,
      isShowCopyIcon: true,
      isVisible: true,
    },
    {
      title: 'Room Password',
      content: password?.value,
      isShowCopyIcon: true,
      isVisible: isShowPassword.value,
    },
    {
      title: 'Room Link',
      content: getUrlWithRoomId(roomId.value),
      isShowCopyIcon: true,
      isVisible: isRoomLinkVisible.value && roomLinkConfig.visible,
    },
  ]);

  function getSeatModeDisplay(isSeatEnabled: boolean) {
    return isSeatEnabled ? 'On-stage Speaking Room' : 'Free Speech Room';
  }

  function copyRoomIdAndRoomLink() {
    const invitationList = [
      roomName.value,
      `${t('Room Type')}: ${t(getSeatModeDisplay(isSeatEnabled.value))}`,
      `${t('Room ID')}: ${roomId.value}`,
    ];
    if (isShowPassword.value) {
      invitationList.push(`${t('Room Password')}: ${password?.value}`);
    }
    if (isRoomLinkVisible.value && roomLinkConfig.visible) {
      invitationList.push(
        `${t('Room Link')}: ${getUrlWithRoomId(roomId.value)}`
      );
    }
    const invitation = invitationList.join('\n');
    onCopy(invitation);
    showRoomInvite.value = false;
  }

  const contactsConfirm = async (contacts: TUIUserInfo[]) => {
    const userIdList = contacts.map(contacts => contacts.userId);
    await roomService.conferenceInvitationManager.inviteUsers({ userIdList });
    TUIMessage({
      type: 'success',
      message: t('Invitation sent, waiting for members to join.'),
      duration: MESSAGE_DURATION.NORMAL,
    });
  };

  return {
    t,
    isRoomLinkVisible,
    roomId,
    origin,
    pathname,
    isElectron,
    inviteLink,
    schemeLink,
    inviteBarTitle,
    onCopy,
    visibleInviteContentList,
    invitationFeatureDetails,
    showContacts,
    contactsConfirm,
    contacts,
    remoteEnteredUserList,
    showRoomInvite,
    userId,
    userName,
    conferenceInviteList,
    copyRoomIdAndRoomLink,
  };
}
