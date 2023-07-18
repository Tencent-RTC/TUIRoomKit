import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';


export default function useRoomFooter() {
  const roomStore = useRoomStore();
  const { t } = useI18n();

  return {
    t,
    roomStore }
  ;
}
