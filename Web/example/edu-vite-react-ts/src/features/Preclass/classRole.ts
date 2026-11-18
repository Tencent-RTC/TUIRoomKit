import { useSyncExternalStore } from 'react';
import { getPlatform } from '@tencentcloud/universal-api';
import type { ClassRole } from './types';

const ROLE_STORAGE_KEY = 'tuiRoom-classRole';

function readInitialRole(): ClassRole {
  if (getPlatform() !== 'pc') return 'student';
  const storedRole = sessionStorage.getItem(ROLE_STORAGE_KEY);
  return storedRole === 'student' ? 'student' : 'teacher';
}

let currentRole = readInitialRole();
const listeners = new Set<() => void>();

export function switchClassRole(role: ClassRole) {
  currentRole = getPlatform() === 'pc' ? role : 'student';
  sessionStorage.setItem(ROLE_STORAGE_KEY, currentRole);
  listeners.forEach(listener => listener());
}

export function useClassRole(): ClassRole {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, () => currentRole);
}
