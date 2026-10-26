import { useEffect, useRef, useState } from 'react';
import { useFreeBeautyState } from 'tuikit-atomicx-react/room';
import { IconReset, TUISlider, TUISwitch, TUIToast } from '../../../base';
import { t, useI18n } from '../../../i18n';
import {
  isBeautyEnabled,
  normalizeBeautyLevels,
  ZERO_BEAUTY,
} from './beauty';
import type { BeautyLevels } from './beauty';
import './BeautySettings.scss';

export interface BeautySettingsProps {
  previewReady?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const rows: Array<{ key: keyof BeautyLevels; labelKey: string }> = [
  { key: 'beautyLevel', labelKey: 'Beauty.Smooth' },
  { key: 'whitenessLevel', labelKey: 'Beauty.Whitening' },
  { key: 'ruddinessLevel', labelKey: 'Beauty.Ruddy' },
];

export function BeautySettings(props: BeautySettingsProps) {
  const { previewReady = true, className, style } = props;
  const { language, t: translate } = useI18n();
  const { beautyConfig, setFreeBeauty, saveBeautySetting } = useFreeBeautyState();
  const isEnglish = language.toLowerCase().startsWith('en');

  const [enabled, setEnabledState] = useState(false);
  const [draft, setDraftState] = useState<BeautyLevels>({ ...ZERO_BEAUTY });
  // Timers and unmount read these synchronously, like Vue refs.
  const enabledRef = useRef(false);
  const draftRef = useRef<BeautyLevels>({ ...ZERO_BEAUTY });
  const didPreviewRef = useRef(false);
  const applyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const beautyConfigRef = useRef(beautyConfig);
  beautyConfigRef.current = beautyConfig;
  const actionsRef = useRef({ setFreeBeauty, saveBeautySetting });
  actionsRef.current = { setFreeBeauty, saveBeautySetting };

  function setEnabled(next: boolean) {
    enabledRef.current = next;
    setEnabledState(next);
  }

  function setDraft(next: BeautyLevels) {
    draftRef.current = next;
    setDraftState(next);
  }

  function snapshot(): BeautyLevels {
    return { ...draftRef.current };
  }

  function restore() {
    const levels = normalizeBeautyLevels(beautyConfigRef.current);
    setDraft(levels);
    setEnabled(isBeautyEnabled(levels));
  }

  async function commit(levels: BeautyLevels) {
    await actionsRef.current.setFreeBeauty(levels);
    // setFreeBeauty only drives enableTestBeautyStyle (camera-test preview).
    // saveBeautySetting calls setBeautyStyle on the published conference stream.
    await actionsRef.current.saveBeautySetting();
    // saveBeautySetting clears the AtomicX cache; refill it so a later camera-on
    // watch reapplies these levels instead of zeros.
    await actionsRef.current.setFreeBeauty(levels);
    didPreviewRef.current = true;
  }

  async function preview(levels: BeautyLevels) {
    try {
      await commit(levels);
    } catch {
      TUIToast.error(t('Beauty.ApplyFailed'));
    }
  }

  function schedulePreview(levels: BeautyLevels) {
    if (applyTimerRef.current) {
      clearTimeout(applyTimerRef.current);
    }
    applyTimerRef.current = setTimeout(() => {
      void preview(levels);
    }, 300);
  }

  function updateLevel(key: keyof BeautyLevels, value: number) {
    setDraft({ ...draftRef.current, [key]: value });
    if (!enabledRef.current) {
      return;
    }
    schedulePreview(snapshot());
  }

  function toggle(next: boolean) {
    setEnabled(next);
    void preview(next ? snapshot() : ZERO_BEAUTY);
  }

  function reset() {
    if (!enabledRef.current) {
      return;
    }
    setDraft({ ...ZERO_BEAUTY });
    void preview(ZERO_BEAUTY);
  }

  const previewReadyRef = useRef(previewReady);
  previewReadyRef.current = previewReady;
  const actionFnsRef = useRef({ restore, preview, snapshot, commit });
  actionFnsRef.current = { restore, preview, snapshot, commit };

  useEffect(() => {
    const fns = actionFnsRef.current;
    fns.restore();
    if (enabledRef.current && previewReadyRef.current) {
      void fns.preview(fns.snapshot());
    }
    return () => {
      if (applyTimerRef.current) {
        clearTimeout(applyTimerRef.current);
      }
      if (!didPreviewRef.current && !enabledRef.current) {
        return;
      }
      const levels = enabledRef.current ? { ...draftRef.current } : ZERO_BEAUTY;
      void actionFnsRef.current.commit(levels).catch(() => {
        TUIToast.error(t('Beauty.ApplyFailed'));
      });
    };
  }, []);

  const isFirstPreviewReadyRef = useRef(true);
  useEffect(() => {
    if (isFirstPreviewReadyRef.current) {
      isFirstPreviewReadyRef.current = false;
      return;
    }
    if (previewReady && enabledRef.current) {
      const fns = actionFnsRef.current;
      void fns.preview(fns.snapshot());
    }
  }, [previewReady]);

  return (
    <div
      className={['beauty-settings', isEnglish ? 'is-en' : '', className ?? ''].filter(Boolean).join(' ')}
      style={style}
      role="tabpanel"
    >
      <div className="beauty-settings-header">
        <span className="beauty-settings-title">{translate('Beauty.Title')}</span>
        <span className="beauty-settings-actions">
          <button
            className="beauty-settings-reset"
            type="button"
            disabled={!enabled}
            aria-label={translate('Beauty.Reset')}
            title={translate('Beauty.Reset')}
            onClick={reset}
          >
            <IconReset size={16} />
          </button>
          <TUISwitch
            modelValue={enabled}
            size="sm"
            aria-label={translate('Beauty.Title')}
            onChange={toggle}
          />
        </span>
      </div>

      <div className="beauty-settings-grid">
        {rows.map(row => (
          <div
            key={row.key}
            className={['beauty-settings-row', !enabled ? 'is-disabled' : ''].filter(Boolean).join(' ')}
          >
            <span className="beauty-settings-name">{translate(row.labelKey)}</span>
            <span className="beauty-settings-controls">
              <TUISlider
                modelValue={draft[row.key]}
                min={0}
                max={100}
                step={1}
                disabled={!enabled}
                onUpdateModelValue={value => updateLevel(row.key, value)}
              />
              <span className="beauty-settings-value">{draft[row.key]}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BeautySettings;
