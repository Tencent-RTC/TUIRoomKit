import { useCallback } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { conference as conferenceImpl } from '../adapter/conference';
import type { IConference } from '../adapter/type';

const conference = conferenceImpl as unknown as IConference;

// Module-scope store so any component in the H5 conference tree can read /
// mutate `showToolbar` without prop drilling. Matches Vue H5's module-level
// `showToolbar = ref(true)` in `useRoomToolbarH5.ts`.
interface RoomToolbarH5State {
  showToolbar: boolean;
  setShowToolbar: (value: boolean) => void;
}

const roomToolbarH5Store = createStore<RoomToolbarH5State>(set => ({
  showToolbar: true,
  setShowToolbar: value => set({ showToolbar: value }),
}));

export function useRoomToolbarH5() {
  const showToolbar = useStore(roomToolbarH5Store, state => state.showToolbar);

  const toggleToolbar = useCallback((event: MouseEvent | React.MouseEvent) => {
    const alwaysShow = conference.getFeatureConfig('toolbar')?.alwaysShow === true;
    if (alwaysShow) {
      return;
    }
    const target = event.target as HTMLElement | null;
    // Toggle toolbar when clicking on the main area or video area, but skip
    // interactive elements so a button/toolbar tap doesn't collapse the UI.
    if (
      target
      && !target.closest('button')
      && !target.closest('.control-bar')
      && !target.closest('.header')
      && !target.closest('.bottom-popup-overlay')
    ) {
      const { showToolbar: current, setShowToolbar } = roomToolbarH5Store.getState();
      setShowToolbar(!current);
    }
  }, []);

  return {
    showToolbar,
    toggleToolbar,
  };
}
