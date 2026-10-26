import { IconMoon, IconSun, useI18n, useUIConfig } from '../../../base';
import TopbarButton from '../../../layouts/TopbarButton';
import './ThemeButton.scss';

export function ThemeButton() {
  const { t } = useI18n();
  const { uiConfig, setUIConfig } = useUIConfig();

  /** The tip names what the click does, like the device toggles, not which theme is on. */
  const label = uiConfig.theme === 'dark' ? t('Settings.ThemeToLight') : t('Settings.ThemeToDark');

  function toggleTheme() {
    setUIConfig({ theme: uiConfig.theme === 'dark' ? 'light' : 'dark' });
  }

  return (
    <span className={['theme-button', uiConfig.theme === 'dark' ? 'is-dark' : ''].filter(Boolean).join(' ')}>
      <TopbarButton label={label} onClick={toggleTheme}>
        <span className="theme-icon-wrap">
          <IconSun className="theme-icon is-sun" size={16} />
          <IconMoon className="theme-icon is-moon" size={16} />
        </span>
      </TopbarButton>
    </span>
  );
}

export default ThemeButton;
