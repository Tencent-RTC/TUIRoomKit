import { TUICheckbox, useI18n } from '@tencentcloud/roomkit-web-react';
import './LoginAgreement.scss';

const PRIVACY_URL = 'https://web.sdk.qcloud.com/document/Tencent-IM-Privacy-Protection-Guidelines.html';
const USER_AGREEMENT_URL = 'https://web.sdk.qcloud.com/document/Tencent-IM-User-Agreement.html';

interface LoginAgreementProps {
  checked: boolean;
  error?: string;
  onToggle: () => void;
}

export function LoginAgreement({ checked, error, onToggle }: LoginAgreementProps) {
  const { t } = useI18n();

  return (
    <div className="login-agreement">
      <TUICheckbox className="login-agreement-check" modelValue={checked} onChange={onToggle}>
        {t('Login.AgreementPrefix')}
        {' '}
        <a className="login-agreement-link" href={PRIVACY_URL}>{t('Login.PrivacyPolicy')}</a>
        {' '}
        {t('Login.And')}
        {' '}
        <a className="login-agreement-link" href={USER_AGREEMENT_URL}>{t('Login.UserAgreement')}</a>
      </TUICheckbox>
      {error && <span className="login-agreement-error">{error}</span>}
    </div>
  );
}

export default LoginAgreement;
