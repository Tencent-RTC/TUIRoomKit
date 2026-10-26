import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  LanguageButton,
  TUIAvatar,
  TUIPopover,
  ThemeButton,
  useI18n,
} from '@tencentcloud/roomkit-web-react';
import logoUrl from '../../../assets/logo.png';
import './PreconferenceTopbar.scss';

export interface PreconferenceTopbarProps {
  userName?: string;
  avatarUrl?: string;
  compact?: boolean;
  previewOpen?: boolean;
  onLogout?: () => void;
  onOpenPreview?: () => void;
}

export function PreconferenceTopbar(props: PreconferenceTopbarProps) {
  const { userName, avatarUrl, onLogout } = props;
  const { t } = useI18n();

  const [profileOpen, setProfileOpen] = useState(false);

  function activateChip(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    (event.currentTarget as HTMLElement).click();
  }

  function logout() {
    setProfileOpen(false);
    onLogout?.();
  }

  return (
    <header className="pre-topbar">
      <div className="pre-logo">
        <span className="pre-logo-mark" aria-hidden="true">
          <img className="pre-logo-img" src={logoUrl} alt="" width="24" height="18" />
        </span>
        <span>TUIRoomKit</span>
      </div>
      <div className="pre-topbar-right">
        <ThemeButton />
        <LanguageButton />
        <TUIPopover
          open={profileOpen}
          onUpdateOpen={setProfileOpen}
          placement="bottom-end"
          padded={false}
          offset={8}
          contentSlot={(
            <div className="profile-pop">
              <div className="profile-pop-head">
                <TUIAvatar
                  size={28}
                  src={avatarUrl}
                  alt={userName || t('Preconference.AvatarFallback')}
                />
                <div className="profile-pop-name">
                  {userName || t('Preconference.Welcome')}
                </div>
              </div>
              <button type="button" className="profile-pop-logout" onClick={logout}>
                {t('Preconference.Logout')}
              </button>
            </div>
          )}
        >
          <div
            className={['user-chip', profileOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
            role="button"
            tabIndex={0}
            onKeyDown={activateChip}
          >
            <TUIAvatar
              size={26}
              src={avatarUrl}
              alt={userName || t('Preconference.AvatarFallback')}
            />
            <span className="user-chip-name">
              {userName || t('Preconference.Welcome')}
            </span>
          </div>
        </TUIPopover>
      </div>
    </header>
  );
}

export default PreconferenceTopbar;
