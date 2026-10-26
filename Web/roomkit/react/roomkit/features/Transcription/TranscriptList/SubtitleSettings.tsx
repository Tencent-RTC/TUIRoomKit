import type { MouseEvent, PointerEvent } from 'react';
import { IconArrowRight, IconCheck, TUISwitch } from '../../../base';
import { useI18n } from '../../../i18n';
import { useSubtitleSettings } from './useSubtitleSettings';
import './SubtitleSettings.scss';

export interface SubtitleSettingsProps {
  placement?: 'top' | 'bottom';
  host?: 'dock' | 'panel';
}

export function SubtitleSettings(props: SubtitleSettingsProps) {
  const {
    placement = 'top',
    host = 'dock',
  } = props;
  const { t } = useI18n();
  const {
    isTransNone,
    canManageASR,
    showTrans,
    setShowTrans,
    fontSize,
    setFontSize,
    pickerType,
    setPickerType,
    sourceLanguageLabel,
    targetLanguageLabel,
    fontSizeOptions,
    transNoneHint,
    pickerValue,
    pickerOptions,
    applyPickedLanguage,
    openPicker,
  } = useSubtitleSettings();

  const pickerTitle = pickerType === 'source'
    ? t('AITools.SourceLanguage')
    : t('AITools.TargetLanguage');

  function stopReactEvent(event: PointerEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    event.nativeEvent.stopPropagation();
  }

  const dockPlacement = host === 'dock' && placement === 'bottom' ? 'cap-settings-bottom' : '';
  const dockPlacementTop = host === 'dock' && placement !== 'bottom' ? 'cap-settings-top' : '';

  return (
    <div
      className={[
        'cap-settings',
        host === 'panel' ? 'cap-settings-panel' : '',
        host === 'dock' ? 'cap-settings-icon' : '',
        dockPlacement,
        dockPlacementTop,
        pickerType ? 'cap-settings-picking' : '',
      ].filter(Boolean).join(' ')}
      onPointerDown={stopReactEvent}
      onClick={stopReactEvent}
    >
      {pickerType
        ? (
          <>
            <div className="cap-settings-picker-head">
              <button
                className="cap-settings-back"
                type="button"
                aria-label={t('AITools.Back')}
                onClick={() => setPickerType(undefined)}
              >
                <IconArrowRight className="cap-settings-back-icon" size={16} />
              </button>
              <span className="cap-settings-picker-title">{pickerTitle}</span>
            </div>
            <div className="cap-settings-picker-list">
              {pickerOptions.map(option => (
                <button
                  key={option.value}
                  className={[
                    'cap-settings-picker-item',
                    option.value === pickerValue ? 'is-selected' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  onClick={() => applyPickedLanguage(option.value)}
                >
                  <span className="cap-settings-picker-label">{option.label}</span>
                  {option.value === pickerValue ? <IconCheck size={14} /> : null}
                </button>
              ))}
            </div>
          </>
        )
        : (
          <>
            {canManageASR
              ? (
                <>
                  <div className="cap-settings-title">
                    {t('AITools.GroupTranscription')}
                  </div>
                  <button
                    className="cap-settings-row is-navigable"
                    type="button"
                    onClick={() => openPicker('source')}
                  >
                    <span className="cap-settings-label">{t('AITools.SourceLanguage')}</span>
                    <span className="cap-settings-value">
                      <span className="cap-settings-value-text">{sourceLanguageLabel}</span>
                      <IconArrowRight size={12} />
                    </span>
                  </button>
                  <div className="cap-settings-separator" />
                </>
              )
              : null}

            <div className="cap-settings-title">
              {t('AITools.GroupTranslation')}
            </div>
            <div className="cap-settings-row is-toggle">
              <span className="cap-settings-label">{t('AITools.SubtitleModeSwitchLabel')}</span>
              {isTransNone
                ? <span className="cap-settings-hint">{transNoneHint}</span>
                : (
                  <TUISwitch
                    modelValue={showTrans}
                    onUpdateModelValue={setShowTrans}
                    size="sm"
                  />
                )}
            </div>
            {canManageASR
              ? (
                <button
                  className={[
                    'cap-settings-row',
                    'is-navigable',
                    !showTrans ? 'is-dimmed' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  onClick={() => openPicker('target')}
                >
                  <span className="cap-settings-label">{t('AITools.TargetLanguage')}</span>
                  <span className="cap-settings-value">
                    <span className="cap-settings-value-text">{targetLanguageLabel}</span>
                    <IconArrowRight size={12} />
                  </span>
                </button>
              )
              : null}

            <div className="cap-settings-separator" />
            <div className="cap-settings-title">
              {t('AITools.GroupSubtitle')}
            </div>
            <div className="cap-settings-row">
              <span className="cap-settings-label">{t('AITools.FontSize')}</span>
              <div className="cap-settings-sizes">
                {fontSizeOptions.map(option => (
                  <button
                    key={option.value}
                    className={[
                      'cap-settings-size',
                      fontSize === option.value ? 'is-active' : '',
                    ].filter(Boolean).join(' ')}
                    type="button"
                    onClick={() => setFontSize(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
    </div>
  );
}

export default SubtitleSettings;
