import { useState } from 'react';
import type { LoginHandler, LoginUserInfo } from '../types';

interface StoredLoginInfo {
  SDKAppID: number;
  apaasUserId: string;
  token: string;
}

const EMPTY_LOGIN_INFO: StoredLoginInfo = { SDKAppID: 0, apaasUserId: '', token: '' };

function storageKey(SDKAppID: number): string {
  return `Login-userInfo-${SDKAppID}`;
}

function readStoredInfo(SDKAppID: number): StoredLoginInfo | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(SDKAppID)) || '{}');
    if (parsed.token) {
      return { ...EMPTY_LOGIN_INFO, ...parsed };
    }
  } catch {
    // Corrupt entries are cleared below.
  }
  localStorage.removeItem(storageKey(SDKAppID));
  return null;
}

export function useLoginSession(SDKAppID: number, onLogin: LoginHandler) {
  const [initialInfo] = useState(() => readStoredInfo(SDKAppID));
  const [isLogin, setIsLogin] = useState(initialInfo !== null);
  const [storedInfo, setStoredInfo] = useState<StoredLoginInfo>(initialInfo ?? EMPTY_LOGIN_INFO);

  function logout(): void {
    setIsLogin(false);
    localStorage.removeItem(storageKey(SDKAppID));
  }

  async function login(userInfo: LoginUserInfo): Promise<void> {
    const loginData: StoredLoginInfo = {
      SDKAppID: userInfo.SDKAppID,
      apaasUserId: userInfo.userID,
      token: userInfo.token || '',
    };
    localStorage.setItem(storageKey(userInfo.SDKAppID), JSON.stringify(loginData));
    setStoredInfo(loginData);
    try {
      await onLogin(userInfo);
    } catch (error) {
      console.error(error);
    }
    setIsLogin(true);
  }

  return {
    isLogin,
    storedInfo,
    login,
    logout,
  };
}
