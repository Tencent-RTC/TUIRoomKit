import { computed, ref } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  createSourceLanguageOptions,
  createTargetLanguageOptions,
  type CaptionFontSize,
} from '../constants';
import { useASRToolsState } from '../useASRToolsState';
import { useSubtitleViewState } from '../useSubtitleViewState';

export type SubtitleSettingsPickerType = 'source' | 'target';

/**
 * Shared language / font / bilingual controls for the PC popover and H5 sheet.
 */
export function useSubtitleSettings() {
  const { t } = useUIKit();
  const {
    sourceLanguage,
    targetLanguage,
    isTransNone,
    canManageASR,
    confirmSaveSettings,
  } = useASRToolsState();
  const { showTrans, fontSize } = useSubtitleViewState();

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
    if (!canManageASR.value) {
      return;
    }
    pickerType.value = type;
  }

  return {
    sourceLanguage,
    targetLanguage,
    isTransNone,
    canManageASR,
    showTrans,
    fontSize,
    pickerType,
    sourceLanguageOptions,
    targetLanguageOptions,
    sourceLanguageLabel,
    targetLanguageLabel,
    fontSizeOptions,
    transNoneHint,
    pickerValue,
    pickerOptions,
    applySourceLanguage,
    applyTargetLanguage,
    applyPickedLanguage,
    openPicker,
  };
}
