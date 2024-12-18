import { ref } from 'vue';
export enum OverlayMap {
  AISubtitlesOverlay = 'AISubtitlesOverlay',
  RoomInviteOverlay = 'RoomInviteOverlay',
}
const overlayMap = ref<{
  [key in OverlayMap]: { visible: boolean };
}>({
  [OverlayMap.AISubtitlesOverlay]: { visible: false },
  [OverlayMap.RoomInviteOverlay]: { visible: false },
});
export function useRoomOverlayHooks() {
  const getOverlayMap = () => overlayMap;
  const toggleOverlayVisibility = (overlay: OverlayMap, isShow: boolean) => {
    overlayMap.value[overlay].visible = isShow;
  };
  return {
    getOverlayMap,
    toggleOverlayVisibility,
  };
}
