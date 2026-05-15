import type { MedicalUser, SessionData } from '@/services/adapters';

const STORAGE_KEY = 'medical-demo-session';

export function saveSession(session: SessionData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getSession(): SessionData | null {
  const value = localStorage.getItem(STORAGE_KEY);
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as SessionData;
  } catch {
    clearSession();
    return null;
  }
}

export function getSessionUser(): MedicalUser | null {
  return getSession()?.user ?? null;
}
