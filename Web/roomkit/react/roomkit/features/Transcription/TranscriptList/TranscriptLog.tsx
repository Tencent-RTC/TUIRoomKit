import { forwardRef, useImperativeHandle } from 'react';
import { useAITranscriberState } from 'tuikit-atomicx-react/room';
import { IconTranscriptEmpty, TUIAvatar, TUIList, TUIListItem } from '../../../base';
import { useI18n } from '../../../i18n';
import { formatTimestampToTime } from '../../../utils/formatTimestamp';
import {
  getDisplayAvatar,
  getDisplayName,
  getRecordLines,
  hasDisplayableText,
  splitHighlightSegments,
  useCaptionParticipants,
} from '../display';
import type { CaptionDisplayMode } from '../constants';
import type { HighlightSegment } from '../display';
import './TranscriptLog.scss';

interface RecordEntry {
  key: string;
  avatarUrl: string;
  speakerName: string;
  nameSegments: HighlightSegment[];
  time: string;
  sourceText: string;
  translationText: string;
  sourceSegments: HighlightSegment[];
  translationSegments: HighlightSegment[];
  isLive: boolean;
}

export interface TranscriptLogProps {
  targetLanguage?: string;
  captionMode?: CaptionDisplayMode;
  keyword?: string;
}

export interface TranscriptLogHandle {
  copyText: () => string;
  entryCount: () => number;
}

function HighlightedText(props: { segments: HighlightSegment[] }) {
  return (
    <>
      {props.segments.map((segment, index) => (
        <span
          key={index}
          className={segment.isMatch ? 'transcript-hit' : undefined}
        >
          {segment.text}
        </span>
      ))}
    </>
  );
}

export const TranscriptLog = forwardRef<TranscriptLogHandle, TranscriptLogProps>(
  (props, ref) => {
    const {
      targetLanguage = '',
      captionMode = 'bilingual',
      keyword = '',
    } = props;
    useCaptionParticipants();
    const { t } = useI18n();
    const { realtimeMessageList } = useAITranscriberState();
    const keywordLabel = keyword.trim();

    const visibleGroups = ((): RecordEntry[] => {
      const entries: RecordEntry[] = [];
      realtimeMessageList
        .filter(message => (
          hasDisplayableText(message.sourceText)
          && typeof message.timestamp === 'number'
          && Number.isFinite(message.timestamp)
        ))
        .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
        .forEach((message, messageIndex) => {
          const speakerUserId = message.speakerUserId || 'unknown';
          const speakerName = getDisplayName(speakerUserId);
          const isLive = message.isCompleted === false;
          const { source, translation } = getRecordLines(
            message,
            targetLanguage,
            captionMode,
          );
          const sourceText = source;
          const translationText = translation;
          if (!sourceText) {
            return;
          }

          const searchableTexts = [speakerName, sourceText, translationText];
          if (keywordLabel && !searchableTexts.join('\n').toLowerCase().includes(keywordLabel.toLowerCase())) {
            return;
          }

          const timestamp = message.timestamp ?? 0;
          entries.push({
            key: message.segmentId || `${speakerUserId}-${timestamp}-${messageIndex}`,
            avatarUrl: getDisplayAvatar(speakerUserId),
            speakerName,
            nameSegments: splitHighlightSegments(speakerName, keywordLabel),
            time: formatTimestampToTime(timestamp, 'HH:mm:ss'),
            sourceText,
            translationText,
            sourceSegments: splitHighlightSegments(sourceText, keywordLabel),
            translationSegments: translationText
              ? splitHighlightSegments(translationText, keywordLabel)
              : [],
            isLive,
          });
        });
      return entries;
    })();

    const isSearchEmpty = Boolean(keywordLabel) && visibleGroups.length === 0;
    const isIdleEmpty = !keywordLabel && visibleGroups.length === 0;

    useImperativeHandle(ref, () => ({
      copyText() {
        return visibleGroups.map((entry) => {
          const translation = entry.translationText ? `\n${entry.translationText}` : '';
          return `[${entry.time}] ${entry.speakerName}：${entry.sourceText}${translation}`;
        }).join('\n');
      },
      entryCount() {
        return visibleGroups.length;
      },
    }), [visibleGroups]);

    return (
      <div className="transcript-list">
        {isSearchEmpty && (
          <div className="transcript-empty is-middle">
            {t('AITools.SearchNoResult', { keyword: keywordLabel })}
          </div>
        )}
        {!isSearchEmpty && isIdleEmpty && (
          <div className="transcript-empty is-middle">
            <IconTranscriptEmpty
              className="transcript-empty-icon"
              size={26}
            />
            <div>{t('AITools.TranscriptEmpty')}</div>
          </div>
        )}
        {!isSearchEmpty && !isIdleEmpty && (
          <div className="transcript-scroll">
            <TUIList
              className="transcript-log"
              variant="plain"
              height="100%"
              itemSize="auto"
              itemHeight={72}
              overscan={8}
              scrollbar
              stickToBottom={!keyword}
              atBottomThreshold={32}
              jumpToEnd
              jumpLabel={t('RoomChat.jump_to_latest')}
            >
              {visibleGroups.map(group => (
                <TUIListItem
                  key={group.key}
                  className="transcript-entry"
                >
                  <TUIAvatar
                    className="transcript-entry-avatar"
                    src={group.avatarUrl}
                    alt={group.speakerName}
                    size={24}
                  />
                  <div className="transcript-entry-main">
                    <div className="transcript-entry-head">
                      <span className="transcript-entry-name">
                        <HighlightedText segments={group.nameSegments} />
                      </span>
                      <span className="transcript-entry-time">{group.time}</span>
                    </div>
                    <div className="transcript-entry-bubble">
                      <div className="transcript-entry-text">
                        {keyword
                          ? <HighlightedText segments={group.sourceSegments} />
                          : group.sourceText}
                        {group.isLive
                          ? (
                            <span
                              className="transcript-typing"
                              aria-label={t('AITools.Recognizing')}
                            >
                              <i />
                              <i />
                              <i />
                            </span>
                          )
                          : null}
                      </div>
                      {group.translationText
                        ? (
                          <div className="transcript-entry-trans">
                            {keyword
                              ? <HighlightedText segments={group.translationSegments} />
                              : group.translationText}
                            {group.isLive
                              ? (
                                <span
                                  className="transcript-typing"
                                  aria-hidden="true"
                                >
                                  <i />
                                  <i />
                                  <i />
                                </span>
                              )
                              : null}
                          </div>
                        )
                        : null}
                    </div>
                  </div>
                </TUIListItem>
              ))}
            </TUIList>
          </div>
        )}
      </div>
    );
  },
);

TranscriptLog.displayName = 'TranscriptLog';

export default TranscriptLog;
