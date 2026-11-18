import type { FormEvent } from 'react';
import { TUIButton, TUIInput, useI18n } from '@tencentcloud/roomkit-web-react';
import LoginAgreement from '../components/LoginAgreement';
import LoginField from '../components/LoginField';
import type { LoginHandler } from '../types';
import { useUserIDLogin } from './useUserIDLogin';
import '../styles/form.scss';

interface UserIDLoginFormProps {
  sdkAppId: number;
  generateUserSig: (userID: string) => string | Promise<string>;
  onLogin: LoginHandler;
}

export function UserIDLoginForm({ sdkAppId, generateUserSig, onLogin }: UserIDLoginFormProps) {
  const { t } = useI18n();
  const {
    form,
    errors,
    isLogin,
    isSubmitting,
    submit,
    toggleAgreement,
    updateUserID,
    logout,
  } = useUserIDLogin(sdkAppId, generateUserSig, onLogin);

  let submitText = isLogin ? t('Login.ConfirmLogin') : t('Login.Title');
  if (isSubmitting) {
    submitText = t('Login.Logging');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <LoginField label="UserID" error={isLogin ? '' : errors.userID}>
        <TUIInput
          modelValue={form.userID}
          disabled={isLogin}
          status={errors.userID ? 'error' : 'default'}
          placeholder={t('Login.UserIdPlaceholder')}
          onInput={value => updateUserID(String(value ?? ''))}
        />
      </LoginField>
      <LoginAgreement checked={form.checked} error={errors.check} onToggle={toggleAgreement} />
      <TUIButton className="login-submit" variant="primary" nativeType="submit" block disabled={isSubmitting}>
        {submitText}
      </TUIButton>
      {isLogin && (
        <TUIButton className="login-secondary" block onClick={logout}>
          {t('Login.SwitchAccount')}
        </TUIButton>
      )}
    </form>
  );
}

export default UserIDLoginForm;
