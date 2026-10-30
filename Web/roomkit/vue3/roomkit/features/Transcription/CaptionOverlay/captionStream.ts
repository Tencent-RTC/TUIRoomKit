export interface CaptionWord {
  key: string;
  text: string;
  nowrap: boolean;
  isPlain: boolean;
  chars: Array<{ key: string; ch: string; isEnter: boolean }>;
}

export const splitGraphemes = (value: string): string[] => {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)]
      .map(part => part.segment);
  }
  return Array.from(value);
};

/**
 * nowrap only guards Latin tokens ("keep English words on one line"). A
 * space-less CJK/Hangul/Kana/Thai run is a single "word" for the segmenter;
 * nowrap on such a run builds an unbreakable line that overflows the
 * one-line caption window and pushes the visible text out of view.
 */
const LATIN_TOKEN_RE = /^[\p{Script=Latin}\p{Nd}'’-]+$/u;

export const splitWordSegments = (value: string): Array<{ text: string; nowrap: boolean }> => {
  if (!value) {
    return [];
  }
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: 'word' }).segment(value)]
      .map(part => ({
        text: part.segment,
        nowrap: Boolean(part.isWordLike) && LATIN_TOKEN_RE.test(part.segment),
      }));
  }
  return value.split(/(\s+)/).filter(Boolean).map(text => ({
    text,
    nowrap: !/^\s+$/.test(text) && LATIN_TOKEN_RE.test(text),
  }));
};

/** Keep English tokens on one line; spaces and punctuation may wrap. */
export const buildCaptionWords = (options: {
  graphemes: string[];
  revealedCount: number;
  isCompleted: boolean;
  settledIndices: Set<number>;
}): CaptionWord[] => {
  const visible = options.graphemes.slice(0, Math.max(0, options.revealedCount));
  const words: CaptionWord[] = [];
  let index = 0;

  splitWordSegments(visible.join('')).forEach((segment) => {
    const startIndex = index;
    const chars = splitGraphemes(segment.text).map((ch) => {
      const charIndex = index;
      index += 1;
      return {
        key: `c:${charIndex}`,
        ch,
        isEnter: !options.isCompleted && !options.settledIndices.has(charIndex),
      };
    });
    words.push({
      key: `w:${startIndex}`,
      text: segment.text,
      nowrap: segment.nowrap,
      isPlain: chars.every(char => !char.isEnter),
      chars,
    });
  });

  return words;
};
