import { computed, ref } from 'vue';
import { t } from '../../../base';
import {
  createSourceLanguageOptions,
  createTargetLanguageOptions,
} from '../constants';
import { useASRState } from '../useASRState';
import type { CaptionFontSize } from '../constants';

export type SubtitleSettingsPickerType = 'source' | 'target';

/** Shared language, font, and bilingual controls for the dock and the transcript panel. */
export function useSubtitleSettings() {
  const {
    sourceLanguage,
    targetLanguage,
    canManageASR,
    confirmSaveSettings,
  } = useASRState();

  const pickerType = ref<SubtitleSettingsPickerType>();

  const sourceLanguageOptions = computed(() => createSourceLanguageOptions(t));
  const targetLanguageOptions = computed(() => createTargetLanguageOptions(t));

  const sourceLanguageLabel = computed(
    () => sourceLanguageOptions.value.find(option => option.value === sourceLanguage.value)?.label ?? '',
  );
  const targetLanguageLabel = computed(
    () => targetLanguageOptions.value.find(option => option.value === targetLanguage.value)?.label ?? '',
  );

  const fontSizeOptions = computed<{ value: CaptionFontSize; label: string }[]>(() => [
    { value: 's', label: t('AITools.FontSizeSmall') },
    { value: 'm', label: t('AITools.FontSizeMedium') },
    { value: 'l', label: t('AITools.FontSizeLarge') },
  ]);

  const transNoneHint = computed(() => (
    canManageASR.value ? t('AITools.TransNoneHostHint') : t('AITools.TransNoneMemberHint')
  ));

  const pickerValue = computed(() => (
    pickerType.value === 'source' ? sourceLanguage.value : targetLanguage.value
  ));
  const pickerOptions = computed(() => (
    pickerType.value === 'source' ? sourceLanguageOptions.value : targetLanguageOptions.value
  ));

  function applySourceLanguage(value: string) {
    confirmSaveSettings({ sourceLanguage: value });
  }

  function applyTargetLanguage(value: string) {
    confirmSaveSettings({ targetLanguage: value });
  }

  function applyPickedLanguage(value: string) {
    const type = pickerType.value;
    pickerType.value = undefined;
    if (type === 'source') {
      applySourceLanguage(value);
      return;
    }
    if (type === 'target') {
      applyTargetLanguage(value);
    }
  }

  function openPicker(type: SubtitleSettingsPickerType) {
    if (!canManageASR.value) {
      return;
    }
    pickerType.value = type;
  }

  return {
    pickerType,
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
