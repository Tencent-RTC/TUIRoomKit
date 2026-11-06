import { ref } from 'vue';
import { getPlatform } from '@tencentcloud/universal-api';
import type { ClassRole } from './types';

const ROLE_STORAGE_KEY = 'tuiRoom-classRole';

/** H5 is student-only; on PC the tab keeps the last pick, and a class link opened in a fresh tab means a student. */
function readInitialRole(): ClassRole {
  if (getPlatform() !== 'pc') {
    return 'student';
  }
  const storedRole = sessionStorage.getItem(ROLE_STORAGE_KEY);
  if (storedRole === 'teacher' || storedRole === 'student') {
    return storedRole;
  }
  const hashQuery = new URLSearchParams(window.location.hash.split('?')[1]);
  return hashQuery.has('roomId') ? 'student' : 'teacher';
}

export const classRole = ref<ClassRole>(readInitialRole());

export function switchClassRole(role: ClassRole) {
  classRole.value = role;
  sessionStorage.setItem(ROLE_STORAGE_KEY, role);
}
