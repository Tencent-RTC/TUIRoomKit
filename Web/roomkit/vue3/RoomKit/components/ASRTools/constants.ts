import type { ASRSettingsOption } from 'tuikit-atomicx-vue3/room';

/** A speaker's caption line is dropped this long after its last update. */
export const SUBTITLE_CLEAR_DELAY_MS = 5000;

/** Upper bound of speakers rendered side by side in the caption dock. */
export const MAX_CONCURRENT_SPEAKERS = 2;

/** Caption lines rendered per speaker: one speaker may wrap, two may not. */
export const MAX_LINES_SINGLE_SPEAKER = 2;
export const MAX_LINES_MULTI_SPEAKER = 1;
/** Enter/leave duration for a concurrent speaker row. */
export const SPEAKER_ROW_TRANSITION_MS = 280;

/**
 * Soft cap on concatenated caption text kept per speaker. The overlay still
 * clips to `MAX_LINES_*`; this only bounds the streaming DOM.
 */
export const MAX_CAPTION_BUFFER_CHARS = 240;

/** Stagger between newly appended graphemes. Rewritten tails are not replayed. */
export const STREAM_CHAR_REVEAL_MS = 30;

export const DEFAULT_SOURCE_LANGUAGE = 'zh';
export const DEFAULT_TARGET_LANGUAGE = 'en';

/**
 * RoomKit-level caption display mode.
 *
 * Deliberately not `SubtitleDisplayMode` from atomicx: that enum has no
 * "source only" value. RoomKit always renders the source as the primary line
 * and optionally shows the translation as a secondary line.
 */
export type CaptionDisplayMode = 'bilingual' | 'source-only';

/**
 * Which placeholder to show while transcription is off.
 * `member-stopped` is distinguished from `member-waiting` so a participant who
 * lost a running feature gets an explanation rather than a waiting prompt.
 */
export type ASREmptyVariant = 'host-idle' | 'member-waiting' | 'member-stopped';

export type CaptionFontSize = 's' | 'm' | 'l';

export const DEFAULT_CAPTION_FONT_SIZE: CaptionFontSize = 's';

/** Floor for PC caption-dock width so the action strip and avatar still fit. */
export const MIN_CAPTION_DOCK_WIDTH = 360;
/** Inset the dock keeps from `.room-container` edges while resizing. */
export const CAPTION_DOCK_EDGE_PADDING = 16;

export const CAPTION_FONT_SIZE_PC: Record<CaptionFontSize, number> = {
  s: 13,
  m: 16,
  l: 20,
};

export const CAPTION_FONT_SIZE_H5: Record<CaptionFontSize, number> = {
  s: 12,
  m: 14,
  l: 18,
};

/** Language options shown before the "show more" fold in language selectors. */
export const LANGUAGE_COLLAPSE_COUNT = 5;

/** The caption dock dims itself after this long without any new speech. */
export const SUBTITLE_IDLE_MS = 5000;

export const createSourceLanguageOptions = (t: (key: string) => string): ASRSettingsOption<string>[] => [
  { label: t('AITools.SourceLanguageChineseEnglish'), value: 'zh' },
  { label: t('AITools.LanguageEnglish'), value: 'en' },
  { label: t('AITools.LanguageCantonese'), value: 'zh-yue' },
  { label: t('AITools.LanguageVietnamese'), value: 'vi' },
  { label: t('AITools.LanguageJapanese'), value: 'ja' },
  { label: t('AITools.LanguageKorean'), value: 'ko' },
  { label: t('AITools.LanguageIndonesian'), value: 'id' },
  { label: t('AITools.LanguageThai'), value: 'th' },
  { label: t('AITools.LanguagePortuguese'), value: 'pt' },
  { label: t('AITools.LanguageTurkish'), value: 'tr' },
  { label: t('AITools.LanguageArabic'), value: 'ar' },
  { label: t('AITools.LanguageSpanish'), value: 'es' },
  { label: t('AITools.LanguageHindi'), value: 'hi' },
  { label: t('AITools.LanguageFrench'), value: 'fr' },
  { label: t('AITools.LanguageMalay'), value: 'ms' },
  { label: t('AITools.LanguageFilipino'), value: 'fil' },
  { label: t('AITools.LanguageGerman'), value: 'de' },
  { label: t('AITools.LanguageItalian'), value: 'it' },
  { label: t('AITools.LanguageRussian'), value: 'ru' },
];

export const createTargetLanguageOptions = (t: (key: string) => string): ASRSettingsOption<string>[] => [
  { label: t('AITools.LanguageChineseSimplified'), value: 'zh' },
  { label: t('AITools.LanguageEnglish'), value: 'en' },
  { label: t('AITools.LanguageVietnamese'), value: 'vi' },
  { label: t('AITools.LanguageJapanese'), value: 'ja' },
  { label: t('AITools.LanguageKorean'), value: 'ko' },
  { label: t('AITools.LanguageIndonesian'), value: 'id' },
  { label: t('AITools.LanguageThai'), value: 'th' },
  { label: t('AITools.LanguagePortuguese'), value: 'pt' },
  { label: t('AITools.LanguageArabic'), value: 'ar' },
  { label: t('AITools.LanguageSpanish'), value: 'es' },
  { label: t('AITools.LanguageFrench'), value: 'fr' },
  { label: t('AITools.LanguageMalay'), value: 'ms' },
  { label: t('AITools.LanguageGerman'), value: 'de' },
  { label: t('AITools.LanguageItalian'), value: 'it' },
  { label: t('AITools.LanguageRussian'), value: 'ru' },
];
