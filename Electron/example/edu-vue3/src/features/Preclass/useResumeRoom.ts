import { ref } from 'vue';

const RESUME_ROOM_STORAGE_KEY = 'tuiRoom-resumeRoomId';

/**
 * HomeView records the class on enter and clears it on any `exited`, so a record
 * that survives into the lobby means this tab was refreshed while in class.
 */
export function rememberResumeRoom(roomId: string) {
  sessionStorage.setItem(RESUME_ROOM_STORAGE_KEY, roomId);
}

export function forgetResumeRoom() {
  sessionStorage.removeItem(RESUME_ROOM_STORAGE_KEY);
}

export function useResumeRoom() {
  const resumeRoomId = ref(sessionStorage.getItem(RESUME_ROOM_STORAGE_KEY) || '');

  function dismissResume() {
    forgetResumeRoom();
    resumeRoomId.value = '';
  }

  return { resumeRoomId, dismissResume };
}
