import { useState } from 'react';
import type { ReactNode } from 'react';
import { IconMonitor, TUIDialog, TUIPopover, useI18n } from '@tencentcloud/roomkit-web-react';

interface PreconferenceTopbarProps {
  userName?: string;
  avatarUrl?: string;
  actions?: ReactNode;
  onLogout: () => void;
}

export default function PreconferenceTopbar({ userName, avatarUrl, actions, onLogout }: PreconferenceTopbarProps) {
  const { t } = useI18n();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isLogoutOpen, setLogoutOpen] = useState(false);
  const displayName = userName || t('Preconference.Welcome');
  const avatar = <span className="pre-avatar" aria-hidden="true">{avatarUrl ? <img src={avatarUrl} alt="" /> : Array.from(displayName)[0]?.toUpperCase()}</span>;
  return (
    <header className="pre-topbar">
      <div className="pre-brand">
        <span className="pre-brand-mark" aria-hidden="true"><IconMonitor size={16} /></span>
        <span className="pre-brand-name">
          RoomKit
          <em>· EDU</em>
        </span>
      </div>
      <div className="pre-topbar-right">
        {actions}
        <TUIPopover
          open={isProfileOpen}
          onUpdateOpen={setProfileOpen}
          placement="bottom-end"
          padded={false}
          offset={8}
          contentSlot={(
            <div className="pre-profile" role="dialog" aria-label={t('Preclass.Profile')}>
              <div className="pre-profile-head">
                {avatar}
                <div className="pre-profile-name">{displayName}</div>
              </div>
              <button
                type="button"
                className="pre-profile-logout"
                onClick={() => {
                  setProfileOpen(false);
                  setLogoutOpen(true);
                }}
              >
                {t('Preconference.Logout')}
              </button>
            </div>
          )}
        >
          <button type="button" className={`pre-who ${isProfileOpen ? 'is-open' : ''}`} aria-haspopup="dialog" aria-expanded={isProfileOpen}>
            {avatar}
            <span className="pre-who-name">{displayName}</span>
          </button>
        </TUIPopover>
      </div>
      <TUIDialog
        open={isLogoutOpen}
        onUpdateOpen={setLogoutOpen}
        width="380px"
        title={t('Preconference.Logout')}
        confirmText={t('Preconference.Logout')}
        cancelText={t('Preclass.Cancel')}
        onConfirm={() => {
          setLogoutOpen(false);
          onLogout();
        }}
      >
        <p className="pre-logout-desc">{t('Preclass.LogoutConfirm')}</p>
      </TUIDialog>
    </header>
  );
}
