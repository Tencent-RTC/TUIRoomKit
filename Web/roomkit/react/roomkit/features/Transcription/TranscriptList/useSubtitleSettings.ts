import { useI18n } from '../../../i18n';
import {
  createSourceLanguageOptions,
  createTargetLanguageOptions,
} from '../constants';
import { useASRState } from '../useASRState';
import { setFontSize, setShowTrans, useSubtitleViewState } from '../useSubtitleViewState';
import type { CaptionFontSize } from '../constants';
import { useState } from 'react';

export type SubtitleSettingsPickerType = 'source' | 'target';

/** Shared language, font, and bilingual controls for the dock and the transcript panel. */
export function useSubtitleSettings() {
  const { t } = useI18n();
  const {
    sourceLanguage,
    targetLanguage,
    isTransNone,
    canManageASR,
    confirmSaveSettings,
  } = useASRState();
  const { showTrans, fontSize } = useSubtitleViewState();
  const [pickerType, setPickerType] = useState<SubtitleSettingsPickerType>();

  const sourceLanguageOptions = createSourceLanguageOptions(t);
  const targetLanguageOptions = createTargetLanguageOptions(t);
  const sourceLanguageLabel = sourceLanguageOptions.find(option => option.value === sourceLanguage)?.label ?? '';
  const targetLanguageLabel = targetLanguageOptions.find(option => option.value === targetLanguage)?.label ?? '';
  const fontSizeOptions: { value: CaptionFontSize; label: string }[] = [
    { value: 's', label: t('AITools.FontSizeSmall') },
    { value: 'm', label: t('AITools.FontSizeMedium') },
    { value: 'l', label: t('AITools.FontSizeLarge') },
  ];
  const transNoneHint = canManageASR ? t('AITools.TransNoneHostHint') : t('AITools.TransNoneMemberHint');
  const pickerValue = pickerType === 'source' ? sourceLanguage : targetLanguage;
  const pickerOptions = pickerType === 'source' ? sourceLanguageOptions : targetLanguageOptions;

  function applySourceLanguage(value: string) {
    confirmSaveSettings({ sourceLanguage: value });
  }

  function applyTargetLanguage(value: string) {
    confirmSaveSettings({ targetLanguage: value });
  }

  function applyPickedLanguage(value: string) {
    const type = pickerType;
    setPickerType(undefined);
    if (!type) {
      return;
    }
    if (type === 'source') {
      applySourceLanguage(value);
      return;
    }
    applyTargetLanguage(value);
  }

  function openPicker(type: SubtitleSettingsPickerType) {
    if (!canManageASR) {
      return;
    }
    setPickerType(type);
  }

  return {
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
  };
}
