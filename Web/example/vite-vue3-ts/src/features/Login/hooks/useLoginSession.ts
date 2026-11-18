import { reactive, readonly, ref } from 'vue';
import type { LoginHandler, LoginUserInfo } from '../types';

interface StoredLoginInfo {
  SDKAppID: number;
  apaasUserId: string;
  token: string;
}

function storageKey(SDKAppID: number): string {
  return `Login-userInfo-${SDKAppID}`;
}

export function useLoginSession(SDKAppID: number, onLogin: LoginHandler) {
  const isLogin = ref(false);
  const storedInfo = reactive<StoredLoginInfo>({ SDKAppID: 0, apaasUserId: '', token: '' });

  function logout(): void {
    isLogin.value = false;
    localStorage.removeItem(storageKey(SDKAppID));
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(SDKAppID)) || '{}');
    if (parsed.token) {
      isLogin.value = true;
      Object.assign(storedInfo, parsed);
    } else {
      logout();
    }
  } catch {
    logout();
  }

  async function login(userInfo: LoginUserInfo): Promise<void> {
    const loginData: StoredLoginInfo = {
      SDKAppID: userInfo.SDKAppID,
      apaasUserId: userInfo.userID,
      token: userInfo.token || '',
    };
    localStorage.setItem(storageKey(userInfo.SDKAppID), JSON.stringify(loginData));
    Object.assign(storedInfo, loginData);
    try {
      await onLogin(userInfo);
    } catch (error) {
      console.error(error);
    }
    isLogin.value = true;
  }

  return {
    isLogin: readonly(isLogin),
    storedInfo: readonly(storedInfo),
    login,
    logout,
  };
}
