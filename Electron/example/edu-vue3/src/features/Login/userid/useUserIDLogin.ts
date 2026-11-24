import { reactive, ref, watch } from 'vue';
import { TUIToast, useI18n } from '@tencentcloud/roomkit-web-vue3';
import { useLoginSession } from '../hooks/useLoginSession';
import type { LoginHandler } from '../types';

const USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

export function useUserIDLogin(
  SDKAppID: number,
  generateUserSig: (userID: string) => string | Promise<string>,
  onLogin: LoginHandler,
) {
  const { t } = useI18n();
  const { isLogin, storedInfo, login, logout } = useLoginSession(SDKAppID, onLogin);

  const form = reactive({ userID: '', checked: false });
  const errors = reactive({ userID: '', check: '' });
  const isSubmitting = ref(false);

  watch(() => storedInfo.apaasUserId, (userID) => {
    form.userID = userID || '';
  }, { immediate: true });

  async function submit(): Promise<void> {
    if (isSubmitting.value) {
      return;
    }
    if (!form.checked) {
      errors.check = t('Login.AgreementRequired');
      return;
    }
    if (!form.userID) {
      errors.userID = t('Login.UserIdRequired');
      return;
    }
    if (!USER_ID_PATTERN.test(form.userID)) {
      errors.userID = t('Login.UserIdInvalid');
      return;
    }
    errors.userID = '';
    errors.check = '';

    isSubmitting.value = true;
    try {
      const userSig = await generateUserSig(form.userID);
      await login({ SDKAppID, userID: form.userID, userSig: userSig || '' });
    } catch (error) {
      console.error('[UserIDLogin] generateUserSig failed:', error);
      TUIToast.error({ message: (error as Error)?.message || t('Login.LoginFailed') });
    } finally {
      isSubmitting.value = false;
    }
  }

  function toggleAgreement(): void {
    form.checked = !form.checked;
    if (form.checked) {
      errors.check = '';
    }
  }

  function clearError(value: string): void {
    if (value) {
      errors.userID = '';
    }
  }

  return {
    form,
    errors,
    isLogin,
    isSubmitting,
    submit,
    toggleAgreement,
    clearError,
    logout,
  };
}
