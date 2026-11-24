import { ref } from 'vue';
import type { ClassRole } from './types';

const ROLE_STORAGE_KEY = 'tuiRoom-classRole';

/** The tab keeps the last pick, and a fresh tab starts as a teacher. */
function readInitialRole(): ClassRole {
  const storedRole = sessionStorage.getItem(ROLE_STORAGE_KEY);
  if (storedRole === 'teacher' || storedRole === 'student') {
    return storedRole;
  }
  return 'teacher';
}

export const classRole = ref<ClassRole>(readInitialRole());

export function switchClassRole(role: ClassRole) {
  classRole.value = role;
  sessionStorage.setItem(ROLE_STORAGE_KEY, role);
}
