import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { IconCopy, IconSearch, IconSettings, TUIInput } from '../../../base';
import { useI18n } from '../../../i18n';
import './TranscriptToolbar.scss';

export interface TranscriptToolbarProps {
  asrOn: boolean;
  mobile?: boolean;
  settingsPressed?: boolean;
  keyword: string;
  searchOpen: boolean;
  onKeywordChange: (value: string) => void;
  onToggleSearch: () => void;
  onCloseSearch: () => void;
  onCopy: () => void;
  onSettings: () => void;
  onCloseSettings: () => void;
  settingsSlot?: ReactNode;
}

export function TranscriptToolbar(props: TranscriptToolbarProps) {
  const {
    asrOn,
    mobile = false,
    settingsPressed = false,
    keyword,
    searchOpen,
    onKeywordChange,
    onToggleSearch,
    onCloseSearch,
    onCopy,
    onSettings,
    onCloseSettings,
    settingsSlot,
  } = props;
  const { t } = useI18n();
  const settingsHostRef = useRef<HTMLDivElement | null>(null);
  const settingsPressedRef = useRef(settingsPressed);
  settingsPressedRef.current = settingsPressed;
  const onCloseSettingsRef = useRef(onCloseSettings);
  onCloseSettingsRef.current = onCloseSettings;

  useEffect(() => {
    function onDocumentPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!settingsPressedRef.current || !target || settingsHostRef.current?.contains(target)) {
        return;
      }
      onCloseSettingsRef.current();
    }
    document.addEventListener('pointerdown', onDocumentPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown);
    };
  }, []);

  return (
    <div className={['transcript-toolbar', mobile ? 'transcript-toolbar-mobile' : ''].filter(Boolean).join(' ')}>
      {searchOpen
        ? (
          <TUIInput
            className="transcript-toolbar-search"
            modelValue={keyword}
            size="sm"
            autoFocus
            placeholder={t('AITools.SearchPlaceholder')}
            prefixSlot={<IconSearch size={14} />}
            onUpdateModelValue={value => onKeywordChange(String(value ?? ''))}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                onCloseSearch();
              }
            }}
          />
        )
        : (
          <span className={['transcript-toolbar-status', !asrOn ? 'is-off' : ''].filter(Boolean).join(' ')}>
            <i />
            {asrOn ? t('AITools.RecordStatusOn') : t('AITools.RecordStatusIdle')}
          </span>
        )}
      <div className="transcript-toolbar-actions">
        <button
          className={['transcript-toolbar-action', searchOpen ? 'is-on' : ''].filter(Boolean).join(' ')}
          type="button"
          aria-label={t('AITools.Search')}
          aria-pressed={searchOpen}
          onClick={(event) => {
            event.stopPropagation();
            onToggleSearch();
          }}
        >
          <IconSearch size={16} />
        </button>
        <button
          className="transcript-toolbar-action"
          type="button"
          aria-label={keyword.trim() ? t('AITools.CopySearchResult') : t('AITools.CopyTranscript')}
          onClick={onCopy}
        >
          <IconCopy size={16} />
        </button>
        <div ref={settingsHostRef} className="transcript-toolbar-settings">
          <button
            className={['transcript-toolbar-action', settingsPressed ? 'is-on' : ''].filter(Boolean).join(' ')}
            type="button"
            aria-label={t('AITools.SettingsTitle')}
            aria-pressed={mobile ? undefined : settingsPressed}
            onClick={(event) => {
              event.stopPropagation();
              onSettings();
            }}
          >
            <IconSettings size={16} />
          </button>
          {settingsSlot}
        </div>
      </div>
    </div>
  );
}

export default TranscriptToolbar;
