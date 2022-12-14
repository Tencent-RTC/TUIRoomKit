import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';

const roomEngine: Record<string, TUIRoomEngine | null> = { instance: null };

export default function useGetRoomEngine() {
  return roomEngine;
}

TUIRoomEngine.once('ready', () => {
  roomEngine.instance = new TUIRoomEngine();
});
