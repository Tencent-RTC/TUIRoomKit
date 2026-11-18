import { useState } from 'react';

const RESUME_ROOM_STORAGE_KEY = 'tuiRoom-resumeRoomId';

/** Home records entry and clears on exited; surviving refreshes can resume. */
export function rememberResumeRoom(roomId: string) {
  sessionStorage.setItem(RESUME_ROOM_STORAGE_KEY, roomId);
}

export function forgetResumeRoom() {
  sessionStorage.removeItem(RESUME_ROOM_STORAGE_KEY);
}

export function useResumeRoom() {
  const [resumeRoomId, setResumeRoomId] = useState(() => sessionStorage.getItem(RESUME_ROOM_STORAGE_KEY) || '');
  function dismissResume() {
    forgetResumeRoom();
    setResumeRoomId('');
  }
  return { resumeRoomId, dismissResume };
}
