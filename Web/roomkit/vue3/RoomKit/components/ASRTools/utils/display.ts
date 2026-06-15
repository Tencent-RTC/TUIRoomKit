import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import type { SubtitleDisplayMode, TranscriberLanguage, TranscriberMessage, TranslationText } from 'tuikit-atomicx-vue3';

const { participantList } = useRoomParticipantState();

const normalizePlainText = (value: string | number | boolean | null | undefined) => String(value ?? '').trim();
const getSourceText = (message: TranscriberMessage) => normalizePlainText(message.sourceText);
const getTranslationTextValue = (translation: TranslationText) => normalizePlainText(translation.text);

export const getDisplayName = (userId: string) => {
  const participant = participantList.value.find(p => p.userId === userId);
  return participant?.nameCard || participant?.userName || participant?.userId || userId;
};

export const hasDisplayableText = (value: string | number | boolean | null | undefined) => !!normalizePlainText(value);

const getTranslationLanguage = (value: unknown): string => {
  if (!value || typeof value !== 'object') {
    return '';
  }

  const candidate = (value as Record<string, unknown>).language;
  return typeof candidate === 'string' ? candidate.trim().toLowerCase() : '';
};

const normalizeTranslations = (translationTexts?: TranslationText[]) => (
  translationTexts?.filter((item) => {
    const language = getTranslationLanguage(item);
    const text = getTranslationTextValue(item);
    return Boolean(language && text);
  }) ?? []
);

const pickTranslationText = (
  translations: TranslationText[],
  targetLanguage: TranscriberLanguage | '',
) => {
  if (translations.length === 0) {
    return '';
  }

  const normalizedTargetLanguage = String(targetLanguage).trim().toLowerCase();
  const normalizedTargetBase = normalizedTargetLanguage.split('-')[0];
  const matchedItem = translations.find((item) => {
    const entryLanguage = getTranslationLanguage(item);
    const entryLanguageBase = entryLanguage.split('-')[0];
    return entryLanguage === normalizedTargetLanguage
      || entryLanguageBase === normalizedTargetBase;
  });

  return getTranslationTextValue(matchedItem ?? translations[0]);
};

export const getTranslationText = (
  message: TranscriberMessage,
  targetLanguage: TranscriberLanguage | '',
) => {
  if (!targetLanguage) {
    return '';
  }

  return pickTranslationText(normalizeTranslations(message.translationTexts), targetLanguage);
};

export const hasTranslationText = (message: TranscriberMessage) => normalizeTranslations(message.translationTexts).length > 0;

export const getMessageDisplayLines = (
  message: TranscriberMessage,
  targetLanguage: TranscriberLanguage | '',
  displayMode: SubtitleDisplayMode,
) => {
  const sourceText = getSourceText(message);
  const translationText = getTranslationText(message, targetLanguage);
  return displayMode === 'translation'
    ? [translationText].filter(Boolean)
    : [sourceText, translationText].filter(Boolean);
};
