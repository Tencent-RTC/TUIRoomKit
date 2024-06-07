import { TUIRoomEngine } from '@tencentcloud/tuiroom-engine-uniapp-app';
import { isVue3 } from '../utils/constants';
import { onBeforeMount } from 'vue';

const roomEngine: Record<string, TUIRoomEngine | null> = { instance: null };
const vueVersion = isVue3 ? 'vue3' : 'vue2';
export default function useGetRoomEngine() {
  function setRoomEngine() {
    roomEngine.instance = new TUIRoomEngine();
  }
  onBeforeMount(() => {
    setRoomEngine();
  });
  return roomEngine;
}

TUIRoomEngine.once('ready', () => {
  TUIRoomEngine.callExperimentalAPI(JSON.stringify({
    api: 'setFramework',
    params: {
      component: 'TUIRoomKit',
      language: vueVersion,
    },
  }));
});
