import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import type { CaptionDisplayMode } from '../constants';
import type { TranscriberLanguage, TranscriberMessage, TranslationText } from 'tuikit-atomicx-vue3/room';

const { participantList } = useRoomParticipantState();

const normalizePlainText = (value: string | number | boolean | null | undefined) => String(value ?? '').trim();
const getSourceText = (message: TranscriberMessage) => normalizePlainText(message.sourceText);
const getTranslationTextValue = (translation: TranslationText) => normalizePlainText(translation.text);
const getParticipant = (userId: string) => participantList.value.find(p => p.userId === userId);

export const getDisplayName = (userId: string) => {
  const participant = getParticipant(userId);
  return participant?.nameCard || participant?.userName || participant?.userId || userId;
};

export const getDisplayAvatar = (userId: string) => getParticipant(userId)?.avatarUrl || '';

export const hasDisplayableText = (value: string | number | boolean | null | undefined) => !!normalizePlainText(value);

const TRAILING_ELLIPSIS = /(?:\.\.\.|…)$/;
/** Trailing marker for an utterance that is still being transcribed. */
export const LIVE_ELLIPSIS = '...';

export const shouldShowLiveEllipsis = (text: string, isLive: boolean) => (
  Boolean(isLive && text && !TRAILING_ELLIPSIS.test(text))
);

/** Incomplete utterances keep a trailing ellipsis, matching the reference transcript. */
export const withLiveEllipsis = (text: string, isLive: boolean) => (
  shouldShowLiveEllipsis(text, isLive) ? `${text}${LIVE_ELLIPSIS}` : text
);

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

/**
 * Concatenate consecutive caption turns without forcing a visual jump.
 * CJK and already-punctuated tails stay glued; Latin words get a space.
 */
export const joinCaptionText = (left: string, right: string): string => {
  if (!left) {
    return right;
  }
  if (!right) {
    return left;
  }
  const glueWithSpace = !/[\s\u3400-\u9fff。！？、，,；;：:]$/.test(left)
    && !/^[\s\u3400-\u9fff]/.test(right);
  return glueWithSpace ? `${left} ${right}` : `${left}${right}`;
};

/**
 * Overlay and record both read source first, then translation. `translation`
 * is empty when `mode` is `source-only` or the utterance has no target text.
 * The caption overlay always requests `bilingual` so hide can animate the
 * existing slot closed instead of deleting the string and snapping height.
 */
export const getRecordLines = (
  message: TranscriberMessage,
  targetLanguage: TranscriberLanguage | '',
  mode: CaptionDisplayMode,
): { source: string; translation: string } => {
  const source = getSourceText(message);
  if (mode === 'source-only') {
    return { source, translation: '' };
  }
  return { source, translation: getTranslationText(message, targetLanguage) };
};

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Splits text around every case-insensitive occurrence of `keyword`, so search
 * hits can be rendered as `<mark>` elements. Returning segments instead of an
 * HTML string keeps Vue's escaping in charge — no manual escaping needed.
 */
export const splitHighlightSegments = (text: string, keyword: string): HighlightSegment[] => {
  const needle = keyword.trim().toLowerCase();
  if (!needle || !text) {
    return [{ text, isMatch: false }];
  }

  const haystack = text.toLowerCase();
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  let hit = haystack.indexOf(needle);

  while (hit !== -1) {
    if (hit > cursor) {
      segments.push({ text: text.slice(cursor, hit), isMatch: false });
    }
    segments.push({ text: text.slice(hit, hit + needle.length), isMatch: true });
    cursor = hit + needle.length;
    hit = haystack.indexOf(needle, cursor);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }

  return segments;
};
