import { TUIRoomEngine } from '@tencentcloud/tuiroom-engine-wx';
import { isVue3 } from '../utils/constants';

const roomEngine: Record<string, TUIRoomEngine | null> = { instance: null };
const vueVersion = isVue3 ? 'vue3' : 'vue2';
export default function useGetRoomEngine() {
  return roomEngine;
}

TUIRoomEngine.once('ready', () => {
  roomEngine.instance = new TUIRoomEngine();
  roomEngine.instance?.callExperimentalAPI(JSON.stringify({
    api: 'setFramework',
    params: {
      component: 'TUIRoomKit',
      language: vueVersion,
    },
  }));
});
