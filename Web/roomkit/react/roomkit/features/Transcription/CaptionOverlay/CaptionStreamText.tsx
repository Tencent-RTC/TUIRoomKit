import { useEffect, useMemo, useRef, useState } from 'react';
import { STREAM_CHAR_REVEAL_MS } from '../constants';
import { buildCaptionWords, splitGraphemes } from './captionStream';
import './CaptionStreamText.scss';

/** Matches the enter animation; settle by timer so wrap cannot replay it. */
const STREAM_CHAR_SETTLE_MS = 300;

export interface CaptionStreamTextProps {
  text: string;
  isCompleted?: boolean;
  /** Blinking caret for the live source line only. */
  showCaret?: boolean;
}

export function CaptionStreamText(props: CaptionStreamTextProps) {
  const { text, isCompleted = false, showCaret = false } = props;
  const graphemes = useMemo(() => splitGraphemes(text), [text]);
  const revealedCountRef = useRef(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const settledRef = useRef<Set<number>>(new Set());
  const [settledIndices, setSettledIndices] = useState<Set<number>>(() => new Set());
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const { length } = graphemes;

    const clearRevealTimer = () => {
      if (revealTimerRef.current === null) {
        return;
      }
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    };

    const clearSettleTimers = () => {
      settleTimersRef.current.forEach((timer) => {
        clearTimeout(timer);
      });
      settleTimersRef.current.clear();
    };

    const markSettled = (index: number) => {
      settleTimersRef.current.delete(index);
      if (settledRef.current.has(index)) {
        return;
      }
      const next = new Set(settledRef.current);
      next.add(index);
      settledRef.current = next;
      setSettledIndices(next);
    };

    const scheduleSettle = (index: number) => {
      if (settleTimersRef.current.has(index) || settledRef.current.has(index)) {
        return;
      }
      settleTimersRef.current.set(index, setTimeout(() => {
        markSettled(index);
      }, STREAM_CHAR_SETTLE_MS));
    };

    /** Append-only typewriter. ASR tail rewrites must not rewind and replay. */
    const scheduleReveal = (target: number) => {
      clearRevealTimer();
      if (revealedCountRef.current >= target) {
        return;
      }
      revealTimerRef.current = setTimeout(() => {
        const index = revealedCountRef.current;
        revealedCountRef.current += 1;
        setRevealedCount(revealedCountRef.current);
        scheduleSettle(index);
        scheduleReveal(target);
      }, STREAM_CHAR_REVEAL_MS);
    };

    if (isCompleted) {
      revealedCountRef.current = length;
      setRevealedCount(length);
      const settled = new Set(Array.from({ length }, (_, index) => index));
      settledRef.current = settled;
      setSettledIndices(settled);
      clearRevealTimer();
      clearSettleTimers();
      return undefined;
    }
    if (length <= revealedCountRef.current) {
      revealedCountRef.current = length;
      setRevealedCount(length);
      clearRevealTimer();
      return undefined;
    }
    scheduleReveal(length);
    return () => {
      if (revealTimerRef.current !== null) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, [graphemes, isCompleted]);

  useEffect(() => () => {
    if (revealTimerRef.current !== null) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    settleTimersRef.current.forEach((timer) => {
      clearTimeout(timer);
    });
    settleTimersRef.current.clear();
  }, []);

  const words = useMemo(() => buildCaptionWords({
    graphemes,
    revealedCount,
    isCompleted,
    settledIndices,
  }), [graphemes, revealedCount, isCompleted, settledIndices]);

  return (
    <span className="cap-stream">
      {words.map(word => (
        <span
          key={word.key}
          className={word.nowrap ? 'cap-stream-word' : undefined}
        >
          {word.isPlain
            ? word.text
            : word.chars.map(item => (
              <span
                key={item.key}
                className={[
                  'cap-stream-char',
                  item.isEnter ? 'cap-stream-char-enter' : '',
                ].filter(Boolean).join(' ')}
              >
                {item.ch}
              </span>
            ))}
        </span>
      ))}
      {showCaret && !isCompleted && text
        ? <span className="cap-stream-caret" aria-hidden="true" />
        : null}
    </span>
  );
}

export default CaptionStreamText;
