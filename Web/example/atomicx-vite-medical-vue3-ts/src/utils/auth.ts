import { useLoginState } from 'tuikit-atomicx-vue3';
import { getBasicInfo } from '@/config/basic-info-config';
import { clearSession, getSession, getSessionUser } from '@/utils/session';

let restorePromise: Promise<boolean> | null = null;

export async function bootstrapSession() {
  const session = getSession();
  if (!session) {
    return false;
  }
  return restoreLoginBySession();
}

export async function restoreLoginBySession(): Promise<boolean> {
  const session = getSession();
  const sessionUser = getSessionUser();

  if (!session || !sessionUser) {
    clearSession();
    return false;
  }

  const { loginUserInfo, login, setSelfInfo } = useLoginState();
  if (loginUserInfo.value?.userId === session.userId) {
    return true;
  }

  if (restorePromise) {
    return restorePromise;
  }

  restorePromise = (async () => {
    try {
      await login(getBasicInfo(session.userId));
      await setSelfInfo({
        userName: sessionUser?.userName || session.userId,
        avatarUrl: sessionUser?.avatarUrl || '',
      });
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      restorePromise = null;
    }
  })();

  return restorePromise;
}
