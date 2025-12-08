import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();
const { currentRoom } = useRoomState();

export enum RoomTabKey {
  Chat = 'chat',
  ParticipantList = 'participantList',
}

interface UseRoomSidePanelReturn {
  activeTab: Ref<RoomTabKey | null>;
  sidePanelTitle: ComputedRef<string>;
  toggleSidePanel: (tab: RoomTabKey) => void;
  closePanel: () => void;
}

export function useRoomSidePanel(): UseRoomSidePanelReturn {
  const activeTab = ref<RoomTabKey | null>(null);

  const sidePanelTitle = computed<string>(() => {
    switch (activeTab.value) {
      case RoomTabKey.ParticipantList:
        return `${t('Participant.Title', { count: currentRoom.value?.participantCount })}`;
      case RoomTabKey.Chat:
        return t('Chat.Title');
      default:
        return '';
    }
  });

  const toggleSidePanel = (tab: RoomTabKey) => {
    if (activeTab.value === tab) {
      activeTab.value = null;
    } else {
      activeTab.value = tab;
    }
  };

  const closePanel = () => {
    activeTab.value = null;
  };

  return {
    activeTab,
    sidePanelTitle,
    toggleSidePanel,
    closePanel,
  };
}
