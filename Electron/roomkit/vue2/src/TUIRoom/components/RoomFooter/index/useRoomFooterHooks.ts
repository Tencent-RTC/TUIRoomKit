import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';
import { storeToRefs } from 'pinia';

export default function useRoomFooter() {
  const roomStore = useRoomStore();
  const { t } = useI18n();
  const { isMaster, isAdmin, isAudience } = storeToRefs(roomStore);

  return {
    t,
    roomStore,
    isMaster,
    isAdmin,
    isAudience,
  };
}
