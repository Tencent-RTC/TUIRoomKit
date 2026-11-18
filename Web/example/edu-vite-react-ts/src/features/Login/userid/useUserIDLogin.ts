import { useEffect, useState } from 'react';
import { TUIToast, useI18n } from '@tencentcloud/roomkit-web-react';
import { useLoginSession } from '../hooks/useLoginSession';
import type { LoginHandler } from '../types';

const USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

interface UserIDLoginErrors {
  userID: string;
  check: string;
}

export function useUserIDLogin(
  SDKAppID: number,
  generateUserSig: (userID: string) => string | Promise<string>,
  onLogin: LoginHandler,
) {
  const { t } = useI18n();
  const { isLogin, storedInfo, login, logout } = useLoginSession(SDKAppID, onLogin);

  const [form, setForm] = useState({ userID: storedInfo.apaasUserId, checked: false });
  const [errors, setErrors] = useState<UserIDLoginErrors>({ userID: '', check: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm(prev => ({ ...prev, userID: storedInfo.apaasUserId || '' }));
  }, [storedInfo.apaasUserId]);

  async function submit(): Promise<void> {
    if (isSubmitting) {
      return;
    }
    if (!form.checked) {
      setErrors(prev => ({ ...prev, check: t('Login.AgreementRequired') }));
      return;
    }
    if (!form.userID) {
      setErrors(prev => ({ ...prev, userID: t('Login.UserIdRequired') }));
      return;
    }
    if (!USER_ID_PATTERN.test(form.userID)) {
      setErrors(prev => ({ ...prev, userID: t('Login.UserIdInvalid') }));
      return;
    }
    setErrors({ userID: '', check: '' });

    setIsSubmitting(true);
    try {
      const userSig = await generateUserSig(form.userID);
      await login({ SDKAppID, userID: form.userID, userSig: userSig || '' });
    } catch (error) {
      console.error('[UserIDLogin] generateUserSig failed:', error);
      TUIToast.error({ message: (error as Error)?.message || t('Login.LoginFailed') });
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleAgreement(): void {
    const checked = !form.checked;
    setForm(prev => ({ ...prev, checked }));
    if (checked) {
      setErrors(prev => ({ ...prev, check: '' }));
    }
  }

  function updateUserID(value: string): void {
    setForm(prev => ({ ...prev, userID: value }));
    if (value) {
      setErrors(prev => ({ ...prev, userID: '' }));
    }
  }

  return {
    form,
    errors,
    isLogin,
    isSubmitting,
    submit,
    toggleAgreement,
    updateUserID,
    logout,
  };
}
