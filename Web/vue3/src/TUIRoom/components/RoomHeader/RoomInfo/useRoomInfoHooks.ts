import { ref, computed } from 'vue';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import SvgIcon from '../../common/base/SvgIcon.vue';
import { ElMessage } from '../../../elementComp';
import { clipBoard } from '../../../utils/utils';
import Arrow from '../../common/icons/ArrowUpIcon.vue';
import copyIcon from '../../common/icons/CopyIcon.vue';
import RoomTime from '../../common/RoomTime.vue';
import vClickOutside from '../../../directives/vClickOutside';
import useRoomInviteControl from '../../RoomInvite/useRoomInviteHooks';
import { isWeChat } from '../../../utils/useMediaValue';

export default function useRoomInfo() {
  const { inviteLink } = useRoomInviteControl();

  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const { roomId } = storeToRefs(basicStore);
  const { masterUserId } = storeToRefs(roomStore);
  const { t } = useI18n();
  const isShowRoomInfo = ref(false);
  const roomType = computed(() => (roomStore.isFreeSpeakMode ? t('Free Speech Room') : t('Raise Hand Room')));
  const arrowDirection = ref(false);

  const masterUserName = computed(() => roomStore.getUserName(masterUserId.value) || masterUserId.value);

  const isShowRoomInfoTitle = computed(() => masterUserName.value);

  const conferenceTitle = computed(() => `${masterUserName.value}${t('Quick Meeting')}`);

  const roomInfoTabList = computed(() => [
    { id: 1, title: 'Host', content: masterUserName.value, copyLink: '', isShowCopyIcon: false },
    { id: 2, title: 'Room Type', content: roomType.value, copyLink: '', isShowCopyIcon: false },
    { id: 3, title: 'Room ID', content: roomId.value, copyLink: roomId.value, isShowCopyIcon: true },
    { id: 4, title: 'Room Link', content: inviteLink.value, copyLink: inviteLink.value, isShowCopyIcon: true },
  ]);

  function toggleShowRoomInfoStatus() {
    isShowRoomInfo.value = !isShowRoomInfo.value;
    arrowDirection.value = !arrowDirection.value;
  }

  function handleClickOutsideRoomInfoContainer() {
    if (isShowRoomInfo.value || arrowDirection.value) {
      isShowRoomInfo.value = false;
      arrowDirection.value = false;
    }
  }

  function handleCloseRoomInfo() {
    isShowRoomInfo.value = false;
    arrowDirection.value = false;
  }
  async function onCopy(value: string | number) {
    try {
      await clipBoard(value);
      ElMessage({
        message: t('Copied successfully'),
        type: 'success',
      });
    } catch (error) {
      ElMessage({
        message: t('Copied failure'),
        type: 'error',
      });
    }
  }
  return {
    t,
    SvgIcon,
    Arrow,
    arrowDirection,
    copyIcon,
    RoomTime,
    vClickOutside,
    isWeChat,
    isShowRoomInfo,
    isShowRoomInfoTitle,
    conferenceTitle,
    roomInfoTabList,
    handleCloseRoomInfo,
    toggleShowRoomInfoStatus,
    handleClickOutsideRoomInfoContainer,
    onCopy,
  };
}
