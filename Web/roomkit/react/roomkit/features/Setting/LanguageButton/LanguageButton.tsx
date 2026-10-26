import { IconCheck, IconChevron, IconGlobe, useI18n } from '../../../base';
import TopbarButton from '../../../layouts/TopbarButton';
import './LanguageButton.scss';

const LANGUAGE_STORAGE_KEY = 'tuiRoom-language';
const options = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'English' },
];

export function LanguageButton() {
  const { language, setLanguage, t } = useI18n();
  const label = language === 'en-US' ? 'English' : '中文';

  function selectLanguage(code: string, close: () => void) {
    if (code !== language) {
      setLanguage(code);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    }
    close();
  }

  return (
    <span className="language-button">
      <TopbarButton
        placement="bottom-end"
        label={t('Settings.Language')}
        aria-label={t('Settings.Language')}
        dropdownSlot={({ close }) => (
          <div className="language-menu" role="listbox">
            {options.map(option => (
              <div
                key={option.code}
                className={['language-menu-item', language === option.code ? 'is-active' : ''].filter(Boolean).join(' ')}
                role="option"
                aria-selected={language === option.code}
                onClick={() => selectLanguage(option.code, close)}
              >
                <span>{option.label}</span>
                <IconCheck className="language-check" size={12} />
              </div>
            ))}
          </div>
        )}
      >
        <IconGlobe size={14} />
        <span>{label}</span>
        <IconChevron className="language-caret" size={10} />
      </TopbarButton>
    </span>
  );
}

export default LanguageButton;
