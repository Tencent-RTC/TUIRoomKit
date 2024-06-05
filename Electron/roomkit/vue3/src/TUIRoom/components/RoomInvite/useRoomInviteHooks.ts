import { computed, ref } from 'vue';
import { useBasicStore } from '../../stores/basic';
import TUIMessage from '../common/base/Message/index';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import { clipBoard } from '../../utils/utils';
import { isElectron } from '../../utils/environment';

export default function useRoomInvite() {
  const { t } = useI18n();

  const basicStore = useBasicStore();
  const { roomId, shareLink, isRoomLinkVisible, isSchemeLinkVisible } = storeToRefs(basicStore);

  const { origin, pathname } = location || {};
  const isShowLink = ref(true);

  const inviteLink = computed(() => {
    if (shareLink.value) {
      const urlConcatenation = shareLink.value.indexOf('?') !== -1 ? '&' : '?';
      return `${shareLink.value}${urlConcatenation}roomId=${roomId.value}`;
    }
    return `${origin}${pathname}#/home?roomId=${roomId.value}`;
  });
  const schemeLink = computed(() => `tuiroom://joinroom?roomId=${roomId.value}`);

  const inviteBarTitle = computed(() => (isRoomLinkVisible.value ? t('You can share the room number or link to invite more people to join the room.') : t('You can share the room number to invite more people to join the room')));


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
    { id: 1, mobileTitle: 'Room ID', pcTitle: 'Invite by room number', content: roomId.value, copyLink: roomId.value, visible: isShowLink.value },
    { id: 2, mobileTitle: 'Room Link', pcTitle: 'Invite via room link', content: inviteLink.value, copyLink: inviteLink.value, visible: isRoomLinkVisible.value },
    { id: 3, mobileTitle: 'scheme', pcTitle: 'Invite via client scheme', content: schemeLink.value, copyLink: schemeLink.value, visible: isSchemeLinkVisible.value },
  ]);

  const visibleInviteContentList = computed(() => inviteContentList.value.filter(item => item.visible));

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
  };
}
