import TUIRoomEngine from '@tencentcloud/tuiroom-engine-wx';

const roomEngine: Record<string, TUIRoomEngine | null> = { instance: null };

export default function useGetRoomEngine() {
  return roomEngine;
}

TUIRoomEngine.once('ready', () => {
  roomEngine.instance = new TUIRoomEngine();
  roomEngine.instance?.callExperimentalAPI(JSON.stringify({
    api: 'setFramework',
    params: {
      component: 'TUIRoomKit',
      language: 'vue3'
    }
  }));
});
