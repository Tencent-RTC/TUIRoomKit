import type { ASRSettingsOption } from 'tuikit-atomicx-react/room';

/** A speaker's caption line is dropped this long after its last update. */
export const SUBTITLE_CLEAR_DELAY_MS = 5000;

/** Upper bound of speakers rendered side by side in the caption dock. */
export const MAX_CONCURRENT_SPEAKERS = 2;

/** Each speaker keeps a single caption line; older text leaves upward. */
export const MAX_CAPTION_LINES = 1;
/** Enter/leave duration for a concurrent speaker row. */
export const SPEAKER_ROW_TRANSITION_MS = 240;

/**
 * Soft cap on concatenated caption text kept per speaker. The overlay still
 * clips to `MAX_CAPTION_LINES`; this only bounds the streaming DOM.
 */
export const MAX_CAPTION_BUFFER_CHARS = 240;

/** Stagger between newly appended graphemes. Rewritten tails are not replayed. */
export const STREAM_CHAR_REVEAL_MS = 30;

export const DEFAULT_SOURCE_LANGUAGE = 'zh';
export const DEFAULT_TARGET_LANGUAGE = 'en';

/**
 * RoomKit caption display mode. The source line is always shown; translation
 * is an optional second line.
 */
export type CaptionDisplayMode = 'bilingual' | 'source-only';

export type CaptionFontSize = 's' | 'm' | 'l';

export const DEFAULT_CAPTION_FONT_SIZE: CaptionFontSize = 'm';

/** Floor for the caption dock width so the action strip and avatar still fit. */
export const MIN_CAPTION_DOCK_WIDTH = 360;
/** Inset the dock keeps from the stage edges while resizing. */
export const CAPTION_DOCK_EDGE_PADDING = 16;

export const CAPTION_FONT_SIZE_PC: Record<CaptionFontSize, number> = {
  s: 13,
  m: 15,
  l: 18,
};

/** The caption dock dims itself after this long without any new speech. */
export const SUBTITLE_IDLE_MS = 5000;

export const createSourceLanguageOptions = (translate: (key: string) => string): ASRSettingsOption<string>[] => [
  { label: translate('AITools.SourceLanguageChineseEnglish'), value: 'zh' },
  { label: translate('AITools.LanguageEnglish'), value: 'en' },
  { label: translate('AITools.LanguageCantonese'), value: 'zh-yue' },
  { label: translate('AITools.LanguageVietnamese'), value: 'vi' },
  { label: translate('AITools.LanguageJapanese'), value: 'ja' },
  { label: translate('AITools.LanguageKorean'), value: 'ko' },
  { label: translate('AITools.LanguageIndonesian'), value: 'id' },
  { label: translate('AITools.LanguageThai'), value: 'th' },
  { label: translate('AITools.LanguagePortuguese'), value: 'pt' },
  { label: translate('AITools.LanguageTurkish'), value: 'tr' },
  { label: translate('AITools.LanguageArabic'), value: 'ar' },
  { label: translate('AITools.LanguageSpanish'), value: 'es' },
  { label: translate('AITools.LanguageHindi'), value: 'hi' },
  { label: translate('AITools.LanguageFrench'), value: 'fr' },
  { label: translate('AITools.LanguageMalay'), value: 'ms' },
  { label: translate('AITools.LanguageFilipino'), value: 'fil' },
  { label: translate('AITools.LanguageGerman'), value: 'de' },
  { label: translate('AITools.LanguageItalian'), value: 'it' },
  { label: translate('AITools.LanguageRussian'), value: 'ru' },
];

export const createTargetLanguageOptions = (translate: (key: string) => string): ASRSettingsOption<string>[] => [
  { label: translate('AITools.LanguageChineseSimplified'), value: 'zh' },
  { label: translate('AITools.LanguageEnglish'), value: 'en' },
  { label: translate('AITools.LanguageVietnamese'), value: 'vi' },
  { label: translate('AITools.LanguageJapanese'), value: 'ja' },
  { label: translate('AITools.LanguageKorean'), value: 'ko' },
  { label: translate('AITools.LanguageIndonesian'), value: 'id' },
  { label: translate('AITools.LanguageThai'), value: 'th' },
  { label: translate('AITools.LanguagePortuguese'), value: 'pt' },
  { label: translate('AITools.LanguageArabic'), value: 'ar' },
  { label: translate('AITools.LanguageSpanish'), value: 'es' },
  { label: translate('AITools.LanguageFrench'), value: 'fr' },
  { label: translate('AITools.LanguageMalay'), value: 'ms' },
  { label: translate('AITools.LanguageGerman'), value: 'de' },
  { label: translate('AITools.LanguageItalian'), value: 'it' },
  { label: translate('AITools.LanguageRussian'), value: 'ru' },
];
