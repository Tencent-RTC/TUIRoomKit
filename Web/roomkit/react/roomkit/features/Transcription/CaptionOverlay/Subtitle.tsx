import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties } from 'react';
import {
  RealtimeTranscriberEvent,
  useAITranscriberState,
} from 'tuikit-atomicx-react/room';
import { TUIAvatar } from '../../../base';
import { useI18n } from '../../../i18n';
import {
  CAPTION_FONT_SIZE_PC,
  DEFAULT_CAPTION_FONT_SIZE,
  MAX_CAPTION_BUFFER_CHARS,
  MAX_CAPTION_LINES,
  MAX_CONCURRENT_SPEAKERS,
  SPEAKER_ROW_TRANSITION_MS,
  SUBTITLE_CLEAR_DELAY_MS,
} from '../constants';
import {
  getDisplayAvatar,
  getDisplayName,
  getRecordLines,
  joinCaptionText,
  useCaptionParticipants,
} from '../display';
import { useSubtitleViewState } from '../useSubtitleViewState';
import CaptionStreamText from './CaptionStreamText';
import type { CaptionDisplayMode, CaptionFontSize } from '../constants';
import type {
  RealtimeTranscriberEventCallback,
  RealtimeTranscriberEventInfoMap,
  TranscriberMessage,
} from 'tuikit-atomicx-react/room';
import './Subtitle.scss';

const PRIMARY_LINE_HEIGHT_RATIO = 1.5;
const SECONDARY_LINE_HEIGHT_RATIO = 1.45;
const SECONDARY_SIZE_RATIO = 0.85;
const SPEAKER_SIZE_RATIO = 0.7;
const MIN_SECONDARY_FONT_SIZE = 12;
const MIN_SPEAKER_FONT_SIZE = 11;
const AVATAR_SIZE = 20;

export interface SubtitleProps {
  targetLanguage?: string;
  captionMode?: CaptionDisplayMode;
  fontSize?: CaptionFontSize;
  /** Keep the last captions on screen while settings are open. */
  pinned?: boolean;
  /** Override the one-shot intro copy (host stopped transcription). */
  placeholderKey?: string;
  /** Keep the placeholder on screen even after the intro flag has cleared. */
  forcePlaceholder?: boolean;
  /** Speaker avatar diameter. Mobile captions use a smaller mark. */
  avatarSize?: number;
}

interface SpeakerCaption {
  speakerUserId: string;
  messages: TranscriberMessage[];
  /** Stable row rank, assigned on first appearance and never updated. */
  slot: number;
}

interface SpeakerRow {
  speakerUserId: string;
  slot: number;
  source: string;
  translation: string;
  isCompleted: boolean;
  maxLines: number;
}

function mergeSpeakerRows(previous: SpeakerRow[], next: SpeakerRow[]) {
  const nextById = new Map(next.map(item => [item.speakerUserId, item]));
  const merged: SpeakerRow[] = [];
  const seen = new Set<string>();
  previous.forEach((item) => {
    merged.push(nextById.get(item.speakerUserId) ?? item);
    seen.add(item.speakerUserId);
  });
  next.forEach((item) => {
    if (seen.has(item.speakerUserId)) {
      return;
    }
    const index = merged.findIndex(existing => existing.slot > item.slot);
    if (index < 0) {
      merged.push(item);
    } else {
      merged.splice(index, 0, item);
    }
  });
  return merged;
}

/** Vue TransitionGroup `name="cap-row"`: enter/leave classes, no appear on mount. */
function useSpeakerRowMotion(messages: SpeakerRow[]) {
  const [rows, setRows] = useState(messages);
  const [motionClass, setMotionClass] = useState<Record<string, string>>({});
  const liveRef = useRef(messages);
  liveRef.current = messages;
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const idKey = messages.map(message => message.speakerUserId).join('\0');
  const contentKey = messages.map(message => (
    `${message.source}\u0001${message.translation}\u0001${message.isCompleted ? 1 : 0}\u0001${message.maxLines}\u0001${message.slot}`
  )).join('\0');

  useLayoutEffect(() => {
    const next = liveRef.current;
    const previous = rowsRef.current;
    const nextIds = new Set(next.map(item => item.speakerUserId));
    const prevIds = new Set(previous.map(item => item.speakerUserId));
    const entering = next.filter(item => !prevIds.has(item.speakerUserId));
    const leaving = previous.filter(item => !nextIds.has(item.speakerUserId));

    if (entering.length === 0 && leaving.length === 0) {
      setMotionClass((current) => {
        const active = new Set(next.map(item => item.speakerUserId));
        let changed = false;
        const motion = { ...current };
        Object.keys(motion).forEach((id) => {
          if (active.has(id) && motion[id]?.includes('leave')) {
            delete motion[id];
            changed = true;
          }
        });
        return changed ? motion : current;
      });
      return undefined;
    }

    setRows(mergeSpeakerRows(previous, next));
    setMotionClass((current) => {
      const motion = { ...current };
      entering.forEach((item) => {
        motion[item.speakerUserId] = 'cap-row-enter-active cap-row-enter-from';
      });
      leaving.forEach((item) => {
        motion[item.speakerUserId] = 'cap-row-leave-active cap-row-leave-to';
      });
      return motion;
    });

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        setMotionClass((current) => {
          const motion = { ...current };
          entering.forEach((item) => {
            if (motion[item.speakerUserId]?.includes('cap-row-enter-from')) {
              motion[item.speakerUserId] = 'cap-row-enter-active';
            }
          });
          return motion;
        });
      });
    });

    const timer = window.setTimeout(() => {
      setRows(liveRef.current);
      setMotionClass((current) => {
        const motion = { ...current };
        entering.forEach((item) => {
          delete motion[item.speakerUserId];
        });
        leaving.forEach((item) => {
          delete motion[item.speakerUserId];
        });
        return motion;
      });
    }, SPEAKER_ROW_TRANSITION_MS);

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(timer);
    };
  }, [idKey]);

  useLayoutEffect(() => {
    const latest = new Map(liveRef.current.map(item => [item.speakerUserId, item]));
    setRows((current) => {
      let changed = false;
      const nextRows = current.map((item) => {
        const updated = latest.get(item.speakerUserId);
        if (!updated || updated === item) {
          return item;
        }
        changed = true;
        return updated;
      });
      return changed ? nextRows : current;
    });
  }, [contentKey]);

  return { rows, motionClass };
}

export function Subtitle(props: SubtitleProps) {
  const {
    targetLanguage = '',
    captionMode = 'bilingual',
    fontSize = DEFAULT_CAPTION_FONT_SIZE,
    pinned = false,
    placeholderKey = 'ASRTools.SubtitlePlaceholder',
    forcePlaceholder = false,
    avatarSize = AVATAR_SIZE,
  } = props;
  useCaptionParticipants();
  const { t } = useI18n();
  const { subscribeEvent, unsubscribeEvent } = useAITranscriberState();
  const {
    enableHintVisible,
    setHasCaptionMessages,
    setEnableHintVisible,
  } = useSubtitleViewState();

  const [speakerCaptions, setSpeakerCaptions] = useState<Record<string, SpeakerCaption>>({});
  const speakerCaptionsRef = useRef(speakerCaptions);
  const subtitleTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const nextSpeakerSlot = useRef(0);
  const pinnedRef = useRef(pinned);
  const targetLanguageRef = useRef(targetLanguage);
  speakerCaptionsRef.current = speakerCaptions;
  pinnedRef.current = pinned;
  targetLanguageRef.current = targetLanguage;

  const primaryFontSize = CAPTION_FONT_SIZE_PC[fontSize];
  const primaryLineHeight = Math.round(primaryFontSize * PRIMARY_LINE_HEIGHT_RATIO);
  const secondaryFontSize = Math.max(
    MIN_SECONDARY_FONT_SIZE,
    Math.round(primaryFontSize * SECONDARY_SIZE_RATIO),
  );
  const secondaryLineHeight = Math.round(secondaryFontSize * SECONDARY_LINE_HEIGHT_RATIO);
  const speakerFontSize = Math.max(
    MIN_SPEAKER_FONT_SIZE,
    Math.round(primaryFontSize * SPEAKER_SIZE_RATIO),
  );
  const captionCssVars = useMemo(() => ({
    '--cap-primary-size': `${primaryFontSize}px`,
    '--cap-primary-line': `${primaryLineHeight}px`,
    '--cap-secondary-size': `${secondaryFontSize}px`,
    '--cap-secondary-line': `${secondaryLineHeight}px`,
    '--cap-speaker-size': `${speakerFontSize}px`,
    '--cap-speaker-line': '18px',
    '--cap-avatar-size': `${avatarSize}px`,
    '--cap-row-duration': `${SPEAKER_ROW_TRANSITION_MS}ms`,
  }), [
    primaryFontSize,
    primaryLineHeight,
    secondaryFontSize,
    secondaryLineHeight,
    speakerFontSize,
    avatarSize,
  ]);

  const resetSubtitleTimeoutRef = useRef<(speakerUserId: string, message: TranscriberMessage) => void>(() => {});
  resetSubtitleTimeoutRef.current = (speakerUserId, message) => {
    if (subtitleTimeout.current[speakerUserId]) {
      clearTimeout(subtitleTimeout.current[speakerUserId]);
    }
    if (pinnedRef.current) {
      return;
    }
    subtitleTimeout.current[speakerUserId] = setTimeout(() => {
      const latest = speakerCaptionsRef.current[speakerUserId];
      const lastMessage = latest?.messages[latest.messages.length - 1];
      if (
        lastMessage?.segmentId === message.segmentId
        && lastMessage?.timestamp === message.timestamp
      ) {
        const remaining = { ...speakerCaptionsRef.current };
        delete remaining[speakerUserId];
        speakerCaptionsRef.current = remaining;
        setSpeakerCaptions(remaining);
      }
      delete subtitleTimeout.current[speakerUserId];
    }, SUBTITLE_CLEAR_DELAY_MS);
  };

  const onMessageRef = useRef<(message: TranscriberMessage) => void>(() => {});
  onMessageRef.current = (message) => {
    const { speakerUserId } = message;
    const joinSpeakerLines = (messages: TranscriberMessage[]) => (
      messages.reduce((acc, item) => {
        const lines = getRecordLines(item, targetLanguageRef.current, 'bilingual');
        return {
          source: joinCaptionText(acc.source, lines.source),
          translation: joinCaptionText(acc.translation, lines.translation),
        };
      }, { source: '', translation: '' })
    );
    const getJoinedSourceLength = (messages: TranscriberMessage[]) => (
      Array.from(joinSpeakerLines(messages).source).length
    );
    const trimSpeakerMessages = (messages: TranscriberMessage[]) => {
      const next = messages.slice();
      while (next.length > 1 && getJoinedSourceLength(next) > MAX_CAPTION_BUFFER_CHARS) {
        next.shift();
      }
      return next;
    };

    const current = speakerCaptionsRef.current[speakerUserId];
    const messages = current ? current.messages.slice() : [];
    const existingIndex = messages.findIndex(item => item.segmentId === message.segmentId);
    if (existingIndex >= 0) {
      messages[existingIndex] = message;
    } else {
      messages.push(message);
    }

    const nextCaptions = {
      ...speakerCaptionsRef.current,
      [speakerUserId]: {
        speakerUserId,
        messages: trimSpeakerMessages(messages),
        slot: current?.slot ?? nextSpeakerSlot.current++,
      },
    };
    speakerCaptionsRef.current = nextCaptions;
    setSpeakerCaptions(nextCaptions);
    resetSubtitleTimeoutRef.current(speakerUserId, message);
  };

  useEffect(() => {
    const handler = (
      eventInfo: RealtimeTranscriberEventInfoMap[
        RealtimeTranscriberEvent.onReceiveTranscriberMessage
      ],
    ) => {
      onMessageRef.current(eventInfo.message);
    };
    subscribeEvent(
      RealtimeTranscriberEvent.onReceiveTranscriberMessage,
      handler as RealtimeTranscriberEventCallback,
    );
    return () => {
      unsubscribeEvent(
        RealtimeTranscriberEvent.onReceiveTranscriberMessage,
        handler as RealtimeTranscriberEventCallback,
      );
      Object.values(subtitleTimeout.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
      subtitleTimeout.current = {};
    };
  }, [subscribeEvent, unsubscribeEvent]);

  const isTranslationShown = captionMode === 'bilingual';

  const displayMessages = useMemo(() => {
    const speakers = Object.values(speakerCaptions)
      .map((speaker) => {
        const lastMessage = speaker.messages[speaker.messages.length - 1];
        const joined = speaker.messages.reduce((acc, message) => {
          const lines = getRecordLines(message, targetLanguage, 'bilingual');
          return {
            source: joinCaptionText(acc.source, lines.source),
            translation: joinCaptionText(acc.translation, lines.translation),
          };
        }, { source: '', translation: '' });
        return {
          speakerUserId: speaker.speakerUserId,
          slot: speaker.slot,
          timestamp: lastMessage?.timestamp ?? 0,
          source: joined.source,
          translation: joined.translation,
          isCompleted: Boolean(lastMessage?.isCompleted),
        };
      })
      .filter(item => Boolean(item.source));

    const visibleIds = new Set(
      [...speakers]
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-MAX_CONCURRENT_SPEAKERS)
        .map(item => item.speakerUserId),
    );
    const visibleSpeakers = speakers
      .filter(item => visibleIds.has(item.speakerUserId))
      .sort((a, b) => a.slot - b.slot);

    return visibleSpeakers.map(item => ({
      speakerUserId: item.speakerUserId,
      slot: item.slot,
      source: item.source,
      translation: item.translation,
      isCompleted: item.isCompleted,
      maxLines: MAX_CAPTION_LINES,
    }));
  }, [speakerCaptions, targetLanguage]);

  const { rows, motionClass } = useSpeakerRowMotion(displayMessages);
  const placeholderText = t(placeholderKey);
  const isPlaceholderVisible = forcePlaceholder
    || (enableHintVisible && displayMessages.length === 0);
  const isEmptyPinned = pinned && displayMessages.length === 0 && !isPlaceholderVisible;
  const isPanelVisible = isPlaceholderVisible || displayMessages.length > 0 || pinned;
  const hasMessages = displayMessages.length > 0;
  const setHasCaptionMessagesRef = useRef(setHasCaptionMessages);
  const setEnableHintVisibleRef = useRef(setEnableHintVisible);
  setHasCaptionMessagesRef.current = setHasCaptionMessages;
  setEnableHintVisibleRef.current = setEnableHintVisible;

  useEffect(() => {
    setHasCaptionMessagesRef.current(hasMessages);
    if (hasMessages) {
      setEnableHintVisibleRef.current(false);
    }
  }, [hasMessages]);

  const skipPinnedWatch = useRef(true);
  useEffect(() => {
    if (skipPinnedWatch.current) {
      skipPinnedWatch.current = false;
      return;
    }
    if (pinned) {
      Object.values(subtitleTimeout.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
      subtitleTimeout.current = {};
      return;
    }
    Object.values(speakerCaptionsRef.current).forEach((speaker) => {
      const lastMessage = speaker.messages[speaker.messages.length - 1];
      if (lastMessage) {
        resetSubtitleTimeoutRef.current(speaker.speakerUserId, lastMessage);
      }
    });
  }, [pinned]);

  const panelStyle = {
    ...captionCssVars,
    display: isPanelVisible ? undefined : 'none',
  } as CSSProperties;

  const messageList = displayMessages.length > 0
    ? (
      <div className="cap-list">
        <div className="cap-row-group">
          {rows.map((item) => {
            const speakerName = getDisplayName(item.speakerUserId);
            const showTranslation = isTranslationShown && Boolean(item.translation);
            return (
              <div
                key={item.speakerUserId}
                className={['cap-row-shell', motionClass[item.speakerUserId] ?? ''].filter(Boolean).join(' ')}
              >
                <div className="cap-row">
                  <TUIAvatar
                    className="cap-avatar"
                    src={getDisplayAvatar(item.speakerUserId)}
                    alt={speakerName}
                    size={avatarSize}
                  />
                  <div className="cap-body">
                    <div className="cap-speaker-row">
                      <span className="cap-speaker" title={speakerName}>
                        {speakerName}
                      </span>
                      {!item.isCompleted
                        ? (
                          <span
                            className="cap-live"
                            aria-label={t('ASRTools.Recognizing')}
                          >
                            <i />
                            <i />
                            <i />
                          </span>
                        )
                        : null}
                    </div>
                    <div
                      className="cap-line cap-line-primary"
                      style={{ maxHeight: `${item.maxLines * primaryLineHeight}px` }}
                    >
                      <span className="cap-line-inner">
                        <CaptionStreamText
                          text={item.source}
                          isCompleted={item.isCompleted}
                          showCaret
                        />
                      </span>
                    </div>
                    <div
                      className={['cap-trans', showTranslation ? 'is-open' : ''].filter(Boolean).join(' ')}
                      aria-hidden={!isTranslationShown || !item.translation}
                    >
                      <div className="cap-trans-clip">
                        <div
                          className="cap-line cap-line-secondary"
                          style={{ maxHeight: `${item.maxLines * secondaryLineHeight}px` }}
                        >
                          <span className="cap-line-inner">
                            <CaptionStreamText
                              text={item.translation}
                              isCompleted={item.isCompleted}
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )
    : null;

  return (
    <div
      className={[
        'cap-panel',
        isPlaceholderVisible ? 'cap-panel-hint' : '',
        isEmptyPinned ? 'cap-panel-empty' : '',
      ].filter(Boolean).join(' ')}
      style={panelStyle}
    >
      {isPlaceholderVisible
        ? (
          <div className="cap-placeholder">
            <span className="cap-placeholder-text">{placeholderText}</span>
          </div>
        )
        : messageList}
    </div>
  );
}

export default Subtitle;
