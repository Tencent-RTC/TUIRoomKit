import TUIRoomEngine, {
  TUIRoomDeviceManager,
} from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from './useRoomEngine';

const roomEngine = useGetRoomEngine();
const deviceManager: { instance: TUIRoomDeviceManager | null | undefined } = {
  instance: null,
};

TUIRoomEngine.once('ready', () => {
  deviceManager.instance = roomEngine.instance?.getMediaDeviceManager();
});

export default function useDeviceManager() {
  return deviceManager;
}
