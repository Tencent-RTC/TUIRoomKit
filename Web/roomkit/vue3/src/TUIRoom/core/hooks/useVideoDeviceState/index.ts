import TUIRoomEngine, {
  TUIRoomDeviceMangerEvents,
} from '@tencentcloud/tuiroom-engine-js';
import useVideoDeviceManagerState from './videoDeviceManagerState';
import useVideoDeviceManager from './videoDeviceManager';
import { initMediaDeviceList, onDeviceChanged } from './videoDeviceListHandler';
import useDeviceManager from '../../../hooks/useDeviceManager';
export { MediaDeviceState } from '../../type';

const deviceManager = useDeviceManager();
const { localVideoQuality, isLocalMirror } = useVideoDeviceManagerState();
const { camera } = useVideoDeviceManager();
TUIRoomEngine.once('ready', () => {
  deviceManager.instance?.on(
    TUIRoomDeviceMangerEvents.onDeviceChanged,
    onDeviceChanged
  );
  initMediaDeviceList();
  // Set the default videoQuality
  camera.updateVideoQuality({ quality: localVideoQuality.value });
  // Setting the default mirror
  camera.switchMirror({ mirror: isLocalMirror.value });
});

export function useVideoDeviceState() {
  const videoDeviceManagerState = useVideoDeviceManagerState();
  const videoDeviceManager = useVideoDeviceManager();
  return {
    ...videoDeviceManagerState,
    ...videoDeviceManager,
  };
}
export default useVideoDeviceState;
