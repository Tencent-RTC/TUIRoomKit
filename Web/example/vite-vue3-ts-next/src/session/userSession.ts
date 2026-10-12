import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { LoginStatus, useLoginState } from 'tuikit-atomicx-vue3/room';
import type { Credentials } from '@tencentcloud/roomkit-web-vue3-next';
import { useRefreshReturn } from '../features/Preconference';

const STORAGE_KEY = 'tuiRoom-userInfo';

export interface StoredUserInfo {
  SDKAppID: number;
  userID: string;
  userSig: string;
}

export function hasStoredSession(): boolean {
  return Boolean(sessionStorage.getItem(STORAGE_KEY));
}

export function readStoredUser(): StoredUserInfo | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredUserInfo> | null;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return {
      SDKAppID: parsed.SDKAppID ?? 0,
      userID: parsed.userID ?? '',
      userSig: parsed.userSig ?? '',
    };
  } catch {
    return null;
  }
}

export function writeStoredUser(user: StoredUserInfo) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function toCredentials(user: StoredUserInfo | null): Credentials {
  return {
    sdkAppId: user?.SDKAppID ?? 0,
    userId: user?.userID ?? '',
    userSig: user?.userSig ?? '',
  };
}

function isDuplicateLogin(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  if ('code' in error && error.code === 2025) {
    return true;
  }
  const message = 'message' in error ? String(error.message) : '';
  return message.includes('"code": 2025') || message.includes('"code":2025');
}

export function useUserSession() {
  const router = useRouter();
  const { login, logout: logoutState, loginStatus, loginUserInfo } = useLoginState();
  const { dismiss } = useRefreshReturn();
  const credentials = toCredentials(readStoredUser());
  // Login only persists credentials. The display name arrives with the profile
  // after useLoginState().login(), so keep this reactive.
  const userName = computed(() => {
    const profile = loginUserInfo.value;
    const profileName = profile?.userId === credentials.userId
      ? profile.userName?.trim()
      : '';
    return profileName || credentials.userId;
  });
  const avatarUrl = computed(() => {
    const profile = loginUserInfo.value;
    if (profile?.userId !== credentials.userId) {
      return '';
    }
    return profile.avatarUrl?.trim() || '';
  });

  function isCurrentUserSignedIn(): boolean {
    return loginStatus.value === LoginStatus.LOGINED
      && loginUserInfo.value?.userId === credentials.userId;
  }

  function ensureLogin() {
    if (!credentials.userId || !credentials.userSig || !credentials.sdkAppId) {
      return;
    }
    // The login page already signed this user in. A second login is rejected
    // as duplicate (2025) and does not initialize the room engine.
    if (isCurrentUserSignedIn()) {
      return;
    }
    login(credentials).catch((error) => {
      if (isDuplicateLogin(error) && isCurrentUserSignedIn()) {
        return;
      }
      console.error('Login failed:', error);
    });
  }

  async function logout() {
    try {
      await logoutState();
    } catch (error) {
      console.error('Logout failed', error);
    }
    clearStoredUser();
    dismiss();
    router.replace('/login');
  }

  onMounted(() => {
    ensureLogin();
  });

  return {
    credentials,
    userName,
    avatarUrl,
    logout,
  };
}
