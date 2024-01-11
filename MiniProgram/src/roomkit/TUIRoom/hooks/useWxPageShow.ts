import { onShow } from '@dcloudio/uni-app';
import { useRoomStore } from '../stores/room';
import useGetRoomEngine from './useRoomEngine';
import logger from '../utils/common/logger';
const roomEngine = useGetRoomEngine();
export default function () {
  const roomStore = useRoomStore();
  async function fetchUserList() {
    try {
      const { userInfoList } = await roomEngine.instance?.getUserList() as any;
      roomStore.setUserList(userInfoList);
    } catch (error: any) {
      logger.error('TUIRoomEngine.getUserList', error.code, error.message);
    }
  }
  async function updateRoomInfo() {
    const roomInfo = await roomEngine.instance?.fetchRoomInfo();
    roomStore.setRoomInfo(roomInfo);
  }
  onShow(() => {
    if (roomStore.userNumber > 1) {
      fetchUserList();
      updateRoomInfo();
    }
  });
}