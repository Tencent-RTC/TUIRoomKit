import { storeToRefs } from 'pinia';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import { computed } from 'vue';
import { useRoomStore } from '../../stores/room';

export default function useSideBar() {
  const { t } = useI18n();

  const basicStore = useBasicStore();
  const { isSidebarOpen, sidebarName } = storeToRefs(basicStore);
  const roomStore = useRoomStore();
  const { userNumber } = storeToRefs(roomStore);


  const showSideBar = computed(() => isSidebarOpen.value && sidebarName.value !== 'transfer-leave');
  const title = computed((): string => {
    let sidebarTitle = '';
    switch (sidebarName.value) {
      case 'chat':
        sidebarTitle = t('Chat');
        break;
      case 'invite':
        sidebarTitle = t('Invite');
        break;
      case 'more':
        sidebarTitle = t('More');
        break;
      case 'apply':
        sidebarTitle = t('Members applying on stage');
        break;
      case 'manage-member':
        sidebarTitle = `${t('Members')} (${userNumber.value})`;
        break;
      default:
        break;
    }
    return sidebarTitle;
  });

  function handleClose(done: any) {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    done();
  }


  return {
    t,
    isSidebarOpen,
    title,
    sidebarName,
    handleClose,
    showSideBar,
  };
}

