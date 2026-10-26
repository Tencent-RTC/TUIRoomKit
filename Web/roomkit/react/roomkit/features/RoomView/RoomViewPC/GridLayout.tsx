import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  FillMode,
  RoomParticipantView,
  VideoStreamType,
} from 'tuikit-atomicx-react/room';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import { IconChevron } from '../../../base/icons';
import { useI18n } from '../../../i18n';
import { isCameraOff, useParticipantStreams } from '../useParticipantStreams';
import { useStreamItemDimensions } from './useStreamItemDimensions';
import type { StreamInfo } from '../useParticipantStreams';
import './GridLayout.scss';

export interface GridLayoutProps {
  onStreamDoubleClick?: (streamInfo: StreamInfo) => void;
  participantViewUISlot?: (scope: { participant: RoomParticipant; streamType: VideoStreamType }) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

const maxColumn = 3;
const maxRow = 3;
const maxCountEveryPage = maxColumn * maxRow;
const gap = 8;

export function GridLayout({
  onStreamDoubleClick,
  participantViewUISlot,
  className,
  style,
}: GridLayoutProps) {
  const { t } = useI18n();
  const { participantStreamList } = useParticipantStreams();

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const gridStreamInfoList = participantStreamList;

  const totalPageNumber = Math.max(1, Math.ceil(gridStreamInfoList.length / maxCountEveryPage));

  const currentPageStreamInfoList = gridStreamInfoList.slice(
    currentPageIndex * maxCountEveryPage,
    (currentPageIndex + 1) * maxCountEveryPage,
  );

  const gridColumns = (() => {
    const count = Math.min(gridStreamInfoList.length, maxCountEveryPage);
    if (count <= 0) {
      return 1;
    }
    return Math.min(Math.ceil(Math.sqrt(count)), maxColumn);
  })();

  const gridRows = (() => {
    const count = Math.min(gridStreamInfoList.length, maxCountEveryPage);
    if (count <= 0) {
      return 1;
    }
    return Math.min(Math.ceil(count / gridColumns), maxRow);
  })();

  const streamListContainerRef = useRef<HTMLDivElement>(null);
  const { itemStyle: streamItemStyle } = useStreamItemDimensions({
    containerRef: streamListContainerRef,
    columns: gridColumns,
    rows: gridRows,
    itemCount: currentPageStreamInfoList.length,
    gap,
    aspectRatio: 16 / 9,
    watchDependencies: [
      gridColumns,
      gridRows,
      currentPageStreamInfoList.length,
    ],
  });

  const streamListContentStyle: CSSProperties = (() => {
    const { width, height } = streamItemStyle;
    if (!width || !height) {
      return {};
    }
    return {
      width: `${Math.ceil(parseInt(width, 10) * gridColumns + (gridColumns - 1) * gap)}px`,
      height: `${Math.ceil(parseInt(height, 10) * gridRows + (gridRows - 1) * gap)}px`,
    };
  })();

  const isFirstLengthWatchRef = useRef(true);
  const streamCount = gridStreamInfoList.length;
  useEffect(() => {
    if (isFirstLengthWatchRef.current) {
      isFirstLengthWatchRef.current = false;
      return;
    }
    const lastPage = Math.max(0, Math.ceil(streamCount / maxCountEveryPage) - 1);
    setCurrentPageIndex(index => (index > lastPage ? lastPage : index));
  }, [streamCount]);

  const showTurnPageControl = totalPageNumber > 1;
  const showTurnPageLeftArrow = currentPageIndex > 0;
  const showTurnPageRightArrow = currentPageIndex < totalPageNumber - 1;

  return (
    <div className={['grid-layout', className].filter(Boolean).join(' ')} style={style}>
      <div
        ref={streamListContainerRef}
        className="grid-layout-body"
      >
        <div
          className={['grid-layout-content', showTurnPageControl ? '' : 'is-center-last'].filter(Boolean).join(' ')}
          style={streamListContentStyle}
        >
          {currentPageStreamInfoList.map(streamInfo => (
            <div
              key={`${streamInfo.participant.userId}_${streamInfo.streamType}`}
              className="grid-layout-tile"
              style={streamItemStyle}
              onDoubleClick={() => onStreamDoubleClick?.(streamInfo)}
            >
              <div className={isCameraOff(streamInfo) ? 'grid-layout-video is-hidden' : 'grid-layout-video'}>
                <RoomParticipantView
                  participant={streamInfo.participant}
                  streamType={streamInfo.streamType}
                  fillMode={FillMode.Fit}
                  lazyLoad={streamInfo.streamType === VideoStreamType.Screen ? { enable: false } : undefined}
                />
              </div>
              {participantViewUISlot?.(streamInfo)}
            </div>
          ))}
        </div>

        {showTurnPageControl && (
          <div className="grid-layout-pager">
            <button
              className="grid-layout-page-btn"
              type="button"
              aria-label={t('RoomView.PrevPage')}
              disabled={!showTurnPageLeftArrow}
              onClick={() => setCurrentPageIndex(index => index - 1)}
            >
              <IconChevron className="grid-layout-page-icon is-prev" size={14} />
            </button>
            <button
              className="grid-layout-page-btn"
              type="button"
              aria-label={t('RoomView.NextPage')}
              disabled={!showTurnPageRightArrow}
              onClick={() => setCurrentPageIndex(index => index + 1)}
            >
              <IconChevron className="grid-layout-page-icon is-next" size={14} />
            </button>
          </div>
        )}
      </div>
      {showTurnPageControl && (
        <div className="grid-layout-page-ind">
          {currentPageIndex + 1}
          {' / '}
          {totalPageNumber}
        </div>
      )}
    </div>
  );
}

export default GridLayout;
