import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MirrorType, VideoQuality, useDeviceState } from 'tuikit-atomicx-react/room';
import {
  IconCheck,
  IconChevron,
  TUISwitch,
  TUIToast,
  useOverlay,
  useUIConfig,
} from '../../../base';
import { i18n, useI18n } from '../../../i18n';
import type { Language } from '../../../i18n';
import type { ThemeName } from '../../../base';
import './SettingsDialogMobile.scss';

type PickKey = 'resolution' | 'language' | 'theme';
type PickValue = VideoQuality | Language | ThemeName;

interface PickConfig {
  titleKey: string;
  options: Array<{ value: PickValue; labelKey: string }>;
}

const PICKS: Record<PickKey, PickConfig> = {
  resolution: {
    titleKey: 'Settings.Resolution',
    options: [
      { value: VideoQuality.Quality1080P, labelKey: 'Settings.Quality1080P' },
      { value: VideoQuality.Quality720P, labelKey: 'Settings.Quality720P' },
      { value: VideoQuality.Quality540P, labelKey: 'Settings.Quality540P' },
      { value: VideoQuality.Quality360P, labelKey: 'Settings.Quality360P' },
    ],
  },
  language: {
    titleKey: 'Settings.Language',
    options: [
      { value: 'zh-CN', labelKey: 'Settings.LanguageZhCN' },
      { value: 'en-US', labelKey: 'Settings.LanguageEnUS' },
    ],
  },
  theme: {
    titleKey: 'Settings.Theme',
    options: [
      { value: 'light', labelKey: 'Settings.ThemeLight' },
      { value: 'dark', labelKey: 'Settings.ThemeDark' },
    ],
  },
};

const GENERAL_PICKS: PickKey[] = ['language', 'theme'];

/** Long enough for the check mark to register before the list slides back. */
const AUTO_BACK_DELAY = 180;

export interface SettingsDialogMobileProps {
  open: boolean;
  onClose?: () => void;
}

export function SettingsDialogMobile(props: SettingsDialogMobileProps) {
  const { open, onClose } = props;
  const { t } = useI18n();
  const { isFrontCamera, localMirrorType, localVideoQuality, switchMirror, updateVideoQuality } = useDeviceState();
  const { uiConfig, setUIConfig } = useUIConfig();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [pick, setPick] = useState<PickKey | null>(null);
  // Keeps the sub page painted while it slides back out.
  const [renderedPick, setRenderedPick] = useState<PickKey | null>(null);
  const backTimerRef = useRef(0);

  // The back camera never mirrors; the switch reads off there and comes back with the front one.
  const mirrorEnabled = isFrontCamera && localMirrorType !== MirrorType.Disable;

  const { host, zIndex } = useOverlay({
    lane: 'dialog',
    open,
    closeOnOutside: false,
    onClose: () => {
      if (pick) {
        popPick();
        return;
      }
      onClose?.();
    },
  }, [rootRef]);

  function currentValue(key: PickKey): PickValue | undefined {
    if (key === 'resolution') {
      return localVideoQuality;
    }
    if (key === 'language') {
      return i18n.language as Language;
    }
    return uiConfig.theme;
  }

  function currentLabel(key: PickKey): string {
    const hit = PICKS[key].options.find(option => option.value === currentValue(key));
    return hit ? t(hit.labelKey) : '';
  }

  function pushPick(key: PickKey) {
    clearTimeout(backTimerRef.current);
    setRenderedPick(key);
    setPick(key);
  }

  function popPick() {
    clearTimeout(backTimerRef.current);
    setPick(null);
  }

  async function selectOption(key: PickKey, value: PickValue) {
    if (value !== currentValue(key)) {
      if (key === 'resolution') {
        try {
          await updateVideoQuality({ quality: value as VideoQuality });
        } catch {
          TUIToast.error(t('Settings.ResolutionFailed'));
          return;
        }
      } else if (key === 'language') {
        i18n.changeLanguage(value as Language);
      } else {
        setUIConfig({ theme: value as ThemeName });
      }
    }
    clearTimeout(backTimerRef.current);
    backTimerRef.current = window.setTimeout(popPick, AUTO_BACK_DELAY);
  }

  async function toggleMirror(enabled: boolean) {
    try {
      await switchMirror({ mirror: enabled ? MirrorType.Auto : MirrorType.Disable });
    } catch {
      TUIToast.error(t('Settings.MirrorFailed'));
    }
  }

  const isFirstOpenRunRef = useRef(true);
  useEffect(() => {
    if (isFirstOpenRunRef.current) {
      isFirstOpenRunRef.current = false;
      return;
    }
    if (open) {
      clearTimeout(backTimerRef.current);
      setPick(null);
      setRenderedPick(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => {
    clearTimeout(backTimerRef.current);
  }, []);

  if (!host) {
    return null;
  }

  return createPortal(
    <div
      ref={rootRef}
      className={[
        'settings-dialog-mobile',
        open ? 'is-open' : '',
        pick ? 'is-sub' : '',
      ].filter(Boolean).join(' ')}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-label={t('Settings.Title')}
      aria-hidden={open ? undefined : 'true'}
    >
      <section
        className="settings-dialog-mobile-page settings-dialog-mobile-root"
        aria-hidden={pick ? 'true' : undefined}
      >
        <header className="settings-dialog-mobile-nav">
          <div
            className="settings-dialog-mobile-back"
            role="button"
            tabIndex={0}
            aria-label={t('Settings.Back')}
            onClick={() => onClose?.()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onClose?.();
              }
            }}
          >
            <IconChevron className="settings-dialog-mobile-back-icon" size={22} />
          </div>
          <h2 className="settings-dialog-mobile-title">
            {t('Settings.Title')}
          </h2>
        </header>

        <div className="settings-dialog-mobile-body">
          <h3 className="settings-dialog-mobile-group">
            {t('Settings.TabVideo')}
          </h3>
          <div className="settings-dialog-mobile-section">
            <div className={['settings-dialog-mobile-row', !isFrontCamera ? 'is-disabled' : ''].filter(Boolean).join(' ')}>
              <div className="settings-dialog-mobile-text">
                <span className="settings-dialog-mobile-label">{t('Settings.Mirror')}</span>
                <span className="settings-dialog-mobile-desc">{t('Settings.MirrorDesc')}</span>
              </div>
              <TUISwitch
                size="lg"
                modelValue={mirrorEnabled}
                disabled={!isFrontCamera}
                aria-label={t('Settings.Mirror')}
                onChange={toggleMirror}
              />
            </div>
            <div
              className="settings-dialog-mobile-row is-pickable"
              role="button"
              tabIndex={0}
              onClick={() => pushPick('resolution')}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  pushPick('resolution');
                }
              }}
            >
              <span className="settings-dialog-mobile-label">{t('Settings.Resolution')}</span>
              <span className="settings-dialog-mobile-value">{currentLabel('resolution')}</span>
              <IconChevron className="settings-dialog-mobile-arrow" size={16} />
            </div>
          </div>

          <h3 className="settings-dialog-mobile-group">
            {t('Settings.TabGeneral')}
          </h3>
          <div className="settings-dialog-mobile-section">
            {GENERAL_PICKS.map(key => (
              <div
                key={key}
                className="settings-dialog-mobile-row is-pickable"
                role="button"
                tabIndex={0}
                onClick={() => pushPick(key)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    pushPick(key);
                  }
                }}
              >
                <span className="settings-dialog-mobile-label">{t(PICKS[key].titleKey)}</span>
                <span className="settings-dialog-mobile-value">{currentLabel(key)}</span>
                <IconChevron className="settings-dialog-mobile-arrow" size={16} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="settings-dialog-mobile-page settings-dialog-mobile-sub"
        aria-hidden={pick ? undefined : 'true'}
      >
        <header className="settings-dialog-mobile-nav">
          <div
            className="settings-dialog-mobile-back"
            role="button"
            tabIndex={0}
            aria-label={t('Settings.Back')}
            onClick={popPick}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                popPick();
              }
            }}
          >
            <IconChevron className="settings-dialog-mobile-back-icon" size={22} />
          </div>
          <h2 className="settings-dialog-mobile-title">
            {renderedPick ? t(PICKS[renderedPick].titleKey) : ''}
          </h2>
        </header>

        <div className="settings-dialog-mobile-body">
          {renderedPick && (
            <div className="settings-dialog-mobile-section" role="radiogroup">
              {PICKS[renderedPick].options.map(option => (
                <div
                  key={String(option.value)}
                  className="settings-dialog-mobile-row is-pickable"
                  role="radio"
                  tabIndex={0}
                  aria-checked={option.value === currentValue(renderedPick)}
                  onClick={() => selectOption(renderedPick, option.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      selectOption(renderedPick, option.value);
                    }
                  }}
                >
                  <span className="settings-dialog-mobile-label">{t(option.labelKey)}</span>
                  {option.value === currentValue(renderedPick) && (
                    <IconCheck
                      className="settings-dialog-mobile-check"
                      size={20}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>,
    host,
  );
}

export default SettingsDialogMobile;
