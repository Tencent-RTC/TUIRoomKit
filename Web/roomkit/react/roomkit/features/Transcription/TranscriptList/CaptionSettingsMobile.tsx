import { useEffect } from 'react';
import { IconArrowRight, IconCheck, IconChevronRightMobile, TUIPopup, TUISwitch } from '../../../base';
import { useI18n } from '../../../i18n';
import { useASRState } from '../useASRState';
import { useSubtitleViewState } from '../useSubtitleViewState';
import { useSubtitleSettings } from './useSubtitleSettings';
import './CaptionSettingsMobile.scss';

export interface CaptionSettingsMobileProps {
  open: boolean;
  onClose?: () => void;
}

export function CaptionSettingsMobile(props: CaptionSettingsMobileProps) {
  const { open, onClose } = props;
  const { t } = useI18n();
  const { asrOn, isTransNone, canManageASR } = useASRState();
  const { capViewOpen, presentCaptionHint, hideCaptionOverlay, showTrans, setShowTrans } = useSubtitleViewState();
  const {
    pickerType,
    setPickerType,
    sourceLanguageLabel,
    targetLanguageLabel,
    transNoneHint,
    pickerValue,
    pickerOptions,
    applyPickedLanguage,
    openPicker,
  } = useSubtitleSettings();

  useEffect(() => {
    if (open) {
      setPickerType(undefined);
    }
  }, [open, setPickerType]);

  const sheetHeight = canManageASR ? '60%' : 'auto';
  const captionsOn = asrOn && capViewOpen;
  let headTitle = t('AITools.SettingsTitle');
  if (pickerType === 'source') {
    headTitle = t('AITools.SelectSourceLanguage');
  } else if (pickerType === 'target') {
    headTitle = t('AITools.SelectTargetLanguage');
  }

  function toggleCaptions(next: boolean) {
    if (!asrOn) {
      return;
    }
    if (next) {
      presentCaptionHint();
      return;
    }
    hideCaptionOverlay();
  }

  return (
    <TUIPopup
      open={open}
      height={sheetHeight}
      closable={false}
      onClose={() => onClose?.()}
      headerSlot={(
        <>
          {pickerType
            ? (
              <button
                className="caption-settings-back"
                type="button"
                aria-label={t('AITools.Back')}
                onClick={() => setPickerType(undefined)}
              >
                <IconArrowRight size={16} />
              </button>
            )
            : null}
          <div className="caption-settings-title">
            {headTitle}
          </div>
        </>
      )}
    >
      <div className="caption-settings-mobile">
        {pickerType
          ? (
            <div className="caption-settings-langs">
              {pickerOptions.map(option => (
                <button
                  key={option.value}
                  className={[
                    'caption-settings-lang',
                    option.value === pickerValue ? 'is-selected' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  onClick={() => applyPickedLanguage(option.value)}
                >
                  <span>{option.label}</span>
                  {option.value === pickerValue ? <IconCheck size={16} /> : null}
                </button>
              ))}
            </div>
          )
          : (
            <>
              {canManageASR
                ? (
                  <div className="caption-settings-row">
                    <span>{t('AITools.H5ShowFloating')}</span>
                    <TUISwitch
                      modelValue={captionsOn}
                      disabled={!asrOn}
                      size="lg"
                      onChange={toggleCaptions}
                    />
                  </div>
                )
                : null}
              {canManageASR
                ? (
                  <button
                    className="caption-settings-row is-nav"
                    type="button"
                    onClick={() => openPicker('source')}
                  >
                    <span>{t('AITools.SourceLanguage')}</span>
                    <span className="caption-settings-value">
                      {sourceLanguageLabel}
                      <IconChevronRightMobile size={12} />
                    </span>
                  </button>
                )
                : null}
              <div className="caption-settings-row">
                <span>{t('AITools.SubtitleModeSwitchLabel')}</span>
                {isTransNone
                  ? <span className="caption-settings-hint">{transNoneHint}</span>
                  : (
                    <TUISwitch
                      modelValue={showTrans}
                      size="lg"
                      onUpdateModelValue={setShowTrans}
                    />
                  )}
              </div>
              {canManageASR
                ? (
                  <button
                    className={[
                      'caption-settings-row',
                      'is-nav',
                      !showTrans ? 'is-dimmed' : '',
                    ].filter(Boolean).join(' ')}
                    type="button"
                    disabled={!showTrans}
                    onClick={() => openPicker('target')}
                  >
                    <span>{t('AITools.TargetLanguage')}</span>
                    <span className="caption-settings-value">
                      {targetLanguageLabel}
                      <IconChevronRightMobile size={12} />
                    </span>
                  </button>
                )
                : null}
            </>
          )}
      </div>
    </TUIPopup>
  );
}

export default CaptionSettingsMobile;
