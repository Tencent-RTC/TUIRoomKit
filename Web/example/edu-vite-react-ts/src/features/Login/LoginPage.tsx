import type { ReactNode } from 'react';
import { RoomKitProvider, TUIButton, i18n, useI18n } from '@tencentcloud/roomkit-web-react';
import loginArtSvg from '../../assets/login-art.svg?raw';
import logoUrl from '../../assets/logo.png';
import './LoginPage.scss';

interface LoginPageProps {
  /** Line under the title; defaults to the UserID-only copy. */
  lead?: string;
  children?: ReactNode;
}

export function LoginPage({ lead, children }: LoginPageProps) {
  const { t, language } = useI18n();

  function toggleLanguage() {
    const next = language === 'en-US' ? 'zh-CN' : 'en-US';
    i18n.changeLanguage(next);
  }

  return (
    <RoomKitProvider className="login-host" scene="education">
      <div className="login-page">
        <TUIButton className="login-page-language" size="sm" onClick={toggleLanguage}>
          {language === 'en-US' ? 'English' : '中文'}
        </TUIButton>
        <aside className="login-page-stage">
          <div className="login-page-stage-inner">
            <div className="login-page-mark">
              <img className="login-page-logo" src={logoUrl} alt="" width="28" height="21" draggable={false} />
              <span>TUIRoomKit</span>
            </div>
            <p className="login-page-brand">
              {t('Login.BrandLine')}
            </p>
            {/* Inlined so the fills follow --rk-brand */}
            {/* eslint-disable-next-line react/no-danger */}
            <span className="login-page-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: loginArtSvg }} />
          </div>
        </aside>
        <section className="login-page-card">
          <div className="login-page-mark login-page-card-mark">
            <img className="login-page-logo" src={logoUrl} alt="" width="28" height="21" draggable={false} />
            <span>TUIRoomKit</span>
          </div>
          <h1 className="login-page-title">
            {t('Login.Title')}
          </h1>
          <p className="login-page-lead">
            {lead || t('Login.LeadUserId')}
          </p>
          <div className="login-page-body">
            {children}
          </div>
        </section>
      </div>
    </RoomKitProvider>
  );
}

export default LoginPage;
