import { TUIOption, TUISelect, useUIConfig } from '../../../base';
import { i18n, useI18n } from '../../../i18n';
import type { Language } from '../../../i18n';
import './GeneralSettings.scss';

const LANGUAGE_OPTIONS: Array<{ value: Language; labelKey: string }> = [
  { value: 'zh-CN', labelKey: 'Settings.LanguageZhCN' },
  { value: 'en-US', labelKey: 'Settings.LanguageEnUS' },
];

const THEME_OPTIONS = [
  { value: 'light' as const, labelKey: 'Settings.ThemeLight' },
  { value: 'dark' as const, labelKey: 'Settings.ThemeDark' },
];

export function GeneralSettings() {
  const { language, t } = useI18n();
  const { uiConfig, setUIConfig } = useUIConfig();
  const { theme } = uiConfig;

  function selectTheme(nextTheme: typeof THEME_OPTIONS[number]['value']) {
    setUIConfig({ theme: nextTheme });
  }

  function selectLanguage(value: string | number | null) {
    const next = LANGUAGE_OPTIONS.find(option => option.value === value);
    if (!next) {
      return;
    }
    i18n.changeLanguage(next.value);
  }

  return (
    <div className="general-settings">
      <div className="general-settings-row">
        <span className="general-settings-row-title">{t('Settings.Theme')}</span>
        <span className="general-settings-row-control">
          <div className="general-settings-theme" role="radiogroup" aria-label={t('Settings.Theme')}>
            {THEME_OPTIONS.map(option => (
              <button
                key={option.value}
                className={['general-settings-theme-option', theme === option.value ? 'is-selected' : ''].filter(Boolean).join(' ')}
                type="button"
                role="radio"
                aria-checked={theme === option.value}
                onClick={() => selectTheme(option.value)}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </span>
      </div>

      <div className="general-settings-row">
        <span className="general-settings-row-title">{t('Settings.Language')}</span>
        <span className="general-settings-row-control">
          <TUISelect modelValue={language} size="sm" onChange={selectLanguage}>
            {LANGUAGE_OPTIONS.map(option => (
              <TUIOption
                key={option.value}
                value={option.value}
                label={t(option.labelKey)}
              />
            ))}
          </TUISelect>
        </span>
      </div>
    </div>
  );
}

export default GeneralSettings;
