import TUIRoomEngine, {
  TUIRoomDeviceMangerEvents,
} from '@tencentcloud/tuiroom-engine-js';
import useAudioDeviceManagerState from './audioDeviceManagerState';
import useAudioDeviceManager from './audioDeviceManager';
import { initMediaDeviceList, onDeviceChanged } from './audioDeviceListHandler';
import useDeviceManager from '../../../hooks/useDeviceManager';
export { MediaDeviceState } from '../../type';

const deviceManager = useDeviceManager();
TUIRoomEngine.once('ready', () => {
  deviceManager.instance?.on(
    TUIRoomDeviceMangerEvents.onDeviceChanged,
    onDeviceChanged
  );
  initMediaDeviceList();
});

export function useAudioDeviceState() {
  const audioDeviceManagerState = useAudioDeviceManagerState();
  const audioDeviceManager = useAudioDeviceManager();
  return {
    ...audioDeviceManagerState,
    ...audioDeviceManager,
  };
}

export default useAudioDeviceState;
