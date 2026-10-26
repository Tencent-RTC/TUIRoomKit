import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode, SyntheticEvent } from 'react';

import {
  DeviceStatus,
  FillMode,
  RoomParticipantView,
  VideoStreamType,
  useLoginState,
  useRoomParticipantState,
} from 'tuikit-atomicx-react/room';
import { IconChevron, IconShare, TUISwiper, TUISwiperItem, usePinchZoom } from '../../../base';
import type { SwiperExpose } from '../../../base/components/Swiper/Swiper';
import { useI18n } from '../../../i18n';
import { isCameraOff, useParticipantStreams } from '../useParticipantStreams';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import type { StreamInfo } from '../useParticipantStreams';
import {
  fitMobileTile,
  pageAfterRosterChange,
  pageAfterSharerChange,
  paginateMobileStreams,
} from './mobileGallery';
import type { MobilePage } from './mobileGallery';
import './GridLayoutMobile.scss';

export interface GridLayoutMobileProps {
  participantViewUISlot?: (scope: {
    participant: RoomParticipant;
    streamType: VideoStreamType;
    inPip?: boolean;
  }) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

const gap = 4;
/** A press that moves less than this is a tap, not a swipe. */
const tapSlop = 10;
/** Smallest distance the sharer's camera window keeps from the stage edge while dragged. */
const pipInset = 16;
/** Matches the `.is-snapping` transition, in case `transitionend` never fires. */
const pipSnapDuration = 220;

/** Silence grace for the current speaker before the window may move to someone else. */
const SPEAKER_HOLD = 1000;

function hasVoice(volume: number | undefined): boolean {
  return volume !== undefined && volume > 0;
}

function findLoudestId(volumes: Map<string, number>): string {
  let loudestId = '';
  let loudest = 0;
  volumes.forEach((volume, userId) => {
    if (volume > loudest) {
      loudest = volume;
      loudestId = userId;
    }
  });
  return loudestId;
}

export function GridLayoutMobile({
  participantViewUISlot,
  className,
  style,
}: GridLayoutMobileProps) {
  const { t } = useI18n();
  const { loginUserInfo } = useLoginState();
  const { participantWithScreen, sortedParticipantCameraList } = useParticipantStreams();

  const [requestedPage, setRequestedPage] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<SwiperExpose | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [chromeVisible, setChromeVisible] = useState(false);
  const chromeTapRef = useRef<{ x: number; y: number; id: number } | null>(null);

  const screenStream: StreamInfo | null = participantWithScreen
    ? { participant: participantWithScreen, streamType: VideoStreamType.Screen }
    : null;

  /** Empty for no share or a local share; the sharer's id for a remote share. */
  const remoteSharerId = (() => {
    const sharerId = participantWithScreen?.userId || '';
    const selfId = loginUserInfo?.userId || '';
    return sharerId && selfId && sharerId !== selfId ? sharerId : '';
  })();

  const view = paginateMobileStreams<StreamInfo>({
    cameras: sortedParticipantCameraList,
    screen: screenStream,
    remoteShare: !!remoteSharerId,
    page: requestedPage,
  });

  const paged = view.pages > 1;
  const pagedRef = useRef(paged);
  pagedRef.current = paged;
  const stageSizeRef = useRef({ width: 0, height: 0 });
  const prevSharerIdRef = useRef(remoteSharerId);
  const prevCameraCountRef = useRef(sortedParticipantCameraList.length);

  function galleryAt(page: number) {
    return paginateMobileStreams<StreamInfo>({
      cameras: sortedParticipantCameraList,
      screen: screenStream,
      remoteShare: !!remoteSharerId,
      page,
    });
  }

  const pages = Array.from({ length: view.pages }, (_, page) => galleryAt(page));

  function tileStyle(pageView: MobilePage<StreamInfo>): CSSProperties {
    const { width, height } = fitMobileTile(
      stageSize.width,
      stageSize.height,
      pageView.columns,
      pageView.rows,
      gap,
    );
    if (pageView.fill || !width || !height) {
      return {};
    }
    return {
      '--grid-layout-mobile-tile-width': `${width}px`,
      '--grid-layout-mobile-gap': `${gap}px`,
      'gridTemplateColumns': `repeat(${pageView.columns}, ${width}px)`,
      'gridTemplateRows': `repeat(${pageView.rows}, ${height}px)`,
      'gap': `${gap}px`,
    } as CSSProperties;
  }

  /* The current page and its neighbours pull streams, so a swipe never lands on a blank grid.
     Every lazy tile must share the stage as its root: the player keeps one observer, and
     a tile asking for another root drops every tile observed before it. */
  function tileLazyLoad(page: number) {
    if (Math.abs(page - view.page) > 1) {
      return { enable: true, viewport: stageRef.current ?? undefined };
    }
    return { enable: false };
  }

  /* The share tile swap remounts across pages; the pinch target follows it through the
     same ref the Vue version uses, so the zoom hook rebinds when the element swaps. */
  const screenTileRef = useRef<HTMLDivElement | null>(null);

  function bindScreenTile(
    tile: HTMLDivElement | null,
    streamInfo: StreamInfo,
    current: boolean,
  ) {
    if (!current || streamInfo.streamType !== VideoStreamType.Screen) {
      return;
    }
    screenTileRef.current = tile;
  }

  const pinchZoom = usePinchZoom(screenTileRef, {
    enabled: view.sharePage,
  });
  /* `reset` gets a new identity every render; keep it behind a ref so the
     stage measure effect stays mount-once, like the Vue original's observers. */
  const resetPinchZoomRef = useRef(pinchZoom.reset);
  resetPinchZoomRef.current = pinchZoom.reset;

  const sharer = participantWithScreen;

  const sharerName = sharer?.nameCard || sharer?.userName || sharer?.userId || '';

  /* The share page window follows the same pick as the desktop mini window: the current
     speaker, held through short silences, and the local user until anyone speaks. */
  const { localParticipant, participantList, speakingUsers } = useRoomParticipantState();

  const [currentSpeakerId, setCurrentSpeakerIdState] = useState('');
  const currentSpeakerIdRef = useRef('');
  const currentSpeakerLastHeardAtRef = useRef(0);
  const localParticipantRef = useRef(localParticipant);
  localParticipantRef.current = localParticipant;

  function setCurrentSpeaker(userId: string) {
    currentSpeakerIdRef.current = userId;
    setCurrentSpeakerIdState(userId);
    currentSpeakerLastHeardAtRef.current = Date.now();
  }

  function clearCurrentSpeaker() {
    currentSpeakerIdRef.current = '';
    setCurrentSpeakerIdState('');
    currentSpeakerLastHeardAtRef.current = 0;
  }

  function pickSpeaker(volumes: Map<string, number>) {
    // People who left the room disappear from speakingUsers; drop a stale id first.
    if (currentSpeakerIdRef.current && !volumes.has(currentSpeakerIdRef.current)) {
      clearCurrentSpeaker();
    }

    // A muted local track still reports volume, so it must not win the window.
    const candidates = new Map(volumes);
    const local = localParticipantRef.current;
    if (local?.microphoneStatus === DeviceStatus.Off) {
      candidates.delete(local.userId);
    }

    const speakerId = currentSpeakerIdRef.current;
    if (speakerId && hasVoice(candidates.get(speakerId))) {
      currentSpeakerLastHeardAtRef.current = Date.now();
      return;
    }

    const loudestId = findLoudestId(candidates);
    if (!loudestId) {
      return;
    }

    const maySwitch = !speakerId || Date.now() - currentSpeakerLastHeardAtRef.current >= SPEAKER_HOLD;
    if (maySwitch) {
      setCurrentSpeaker(loudestId);
    }
  }

  const isFirstSpeakingWatchRef = useRef(true);
  useEffect(() => {
    if (isFirstSpeakingWatchRef.current) {
      isFirstSpeakingWatchRef.current = false;
      return;
    }
    pickSpeaker(speakingUsers);
  }, [speakingUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentSpeaker = (() => {
    if (!currentSpeakerId) {
      return undefined;
    }
    if (localParticipant?.userId === currentSpeakerId) {
      return localParticipant;
    }
    return participantList.find(item => item.userId === currentSpeakerId);
  })();

  const pipParticipant = currentSpeaker ?? localParticipant;

  const pipName = pipParticipant?.nameCard || pipParticipant?.userName || pipParticipant?.userId || '';

  const pipRef = useRef<HTMLDivElement | null>(null);
  /** Null keeps the window at its top-right corner; a drag pins it to a stage offset. */
  const [pipPosition, setPipPosition] = useState<{ x: number; y: number } | null>(null);
  const pipPositionRef = useRef<{ x: number; y: number } | null>(null);
  const pipDragRef = useRef<{ id: number; dx: number; dy: number } | null>(null);
  /** Animates the release onto the nearer side edge; the drag itself follows the finger. */
  const [pipSnapping, setPipSnapping] = useState(false);
  const pipSnapTimerRef = useRef(0);

  function applyPipPosition(next: { x: number; y: number } | null) {
    pipPositionRef.current = next;
    setPipPosition(next);
  }

  const pipStyle: CSSProperties = pipPosition
    ? { left: `${pipPosition.x}px`, top: `${pipPosition.y}px`, right: 'auto' }
    : {};

  /** A different remote sharer sends the viewer back to the share page. */
  const sharerFirstRunRef = useRef(true);
  useEffect(() => {
    if (sharerFirstRunRef.current) {
      sharerFirstRunRef.current = false;
      return;
    }
    const previous = prevSharerIdRef.current;
    prevSharerIdRef.current = remoteSharerId;
    setRequestedPage(requested => pageAfterSharerChange(previous || '', remoteSharerId, requested));
    pinchZoom.reset();
    if (remoteSharerId && remoteSharerId !== previous) {
      applyPipPosition(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteSharerId]);

  /** Keep the requested page in range, so a page that empties out does not leave a stale index. */
  useEffect(() => {
    setRequestedPage(requested => (view.page !== requested ? view.page : requested));
  }, [view.page]);

  useEffect(() => {
    if (!paged) {
      setChromeVisible(false);
    }
  }, [paged]);

  /** Someone joining nudges the pager into view, so a new page is not missed. */
  const rosterFirstRunRef = useRef(true);
  const cameraCount = sortedParticipantCameraList.length;
  useEffect(() => {
    if (rosterFirstRunRef.current) {
      rosterFirstRunRef.current = false;
      return;
    }
    const previous = prevCameraCountRef.current;
    prevCameraCountRef.current = cameraCount;
    setRequestedPage(requested => pageAfterRosterChange(previous, cameraCount, !!screenStream, requested));
    if (cameraCount === previous + 1) {
      revealChrome();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraCount]);

  function handlePipPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    event.preventDefault();
    const pip = event.currentTarget;
    const rect = pip.getBoundingClientRect();
    pipDragRef.current = {
      id: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
    };
    window.clearTimeout(pipSnapTimerRef.current);
    setPipSnapping(false);
    try {
      pip.setPointerCapture(event.pointerId);
    } catch {
      // The pointer may already be gone.
    }
  }

  function pipStageRect(pip: HTMLElement) {
    return (pip.offsetParent instanceof HTMLElement ? pip.offsetParent : rootRef.current)?.getBoundingClientRect() ?? null;
  }

  function handlePipPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const pipDrag = pipDragRef.current;
    const pip = pipRef.current;
    if (!pipDrag || event.pointerId !== pipDrag.id || !pip) {
      return;
    }
    const stage = pipStageRect(pip);
    if (!stage) {
      return;
    }
    const maxX = stage.width - pip.offsetWidth - pipInset;
    const maxY = stage.height - pip.offsetHeight - pipInset;
    applyPipPosition({
      x: Math.max(pipInset, Math.min(maxX, event.clientX - stage.left - pipDrag.dx)),
      y: Math.max(pipInset, Math.min(maxY, event.clientY - stage.top - pipDrag.dy)),
    });
  }

  /** A released window settles on the nearer side edge and keeps its height. */
  function snapPip() {
    const pip = pipRef.current;
    const position = pipPositionRef.current;
    if (!pip || !position) {
      return;
    }
    const stage = pipStageRect(pip);
    if (!stage) {
      return;
    }
    const rightX = stage.width - pip.offsetWidth - pipInset;
    const x = position.x + pip.offsetWidth / 2 < stage.width / 2 ? pipInset : rightX;
    if (x === position.x) {
      return;
    }
    setPipSnapping(true);
    applyPipPosition({ x, y: position.y });
    window.clearTimeout(pipSnapTimerRef.current);
    pipSnapTimerRef.current = window.setTimeout(() => {
      setPipSnapping(false);
    }, pipSnapDuration + 50);
  }

  function handlePipPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (pipDragRef.current && event.pointerId === pipDragRef.current.id) {
      pipDragRef.current = null;
      snapPip();
    }
  }

  function isChromeControl(event: ReactPointerEvent<HTMLDivElement> | SyntheticEvent) {
    const { target } = event;
    if (!(target instanceof Element)) {
      return false;
    }
    return !!target.closest(
      '.grid-layout-mobile-page-btn, .grid-layout-mobile-pip, .participant-view-overlay-flip',
    );
  }

  /** Show the pager and leave it up until the next tap on empty stage. */
  function revealChrome() {
    setChromeVisible(pagedRef.current);
  }

  function onChromePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    if (isChromeControl(event)) {
      return;
    }
    chromeTapRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }

  function onChromePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const chromeTap = chromeTapRef.current;
    if (!chromeTap || event.pointerId !== chromeTap.id) {
      return;
    }
    const dx = event.clientX - chromeTap.x;
    const dy = event.clientY - chromeTap.y;
    chromeTapRef.current = null;
    if (isChromeControl(event) || Math.hypot(dx, dy) > tapSlop) {
      return;
    }
    if (!pagedRef.current) {
      setChromeVisible(false);
      return;
    }
    setChromeVisible(visible => !visible);
  }

  function onChromePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    if (chromeTapRef.current && event.pointerId === chromeTapRef.current.id) {
      chromeTapRef.current = null;
    }
  }

  function shiftPage(direction: number) {
    swiperRef.current?.slideTo(view.page + direction);
  }

  /** A zoomed share pans under one finger; the swiper must not turn that into a page change. */
  function holdZoomedShare(event: ReactPointerEvent<HTMLDivElement>) {
    if (view.sharePage && pinchZoom.isZoomed.current) {
      event.stopPropagation();
    }
  }

  const measureStage = useCallback(() => {
    const el = stageRef.current;
    if (!el) {
      return;
    }
    const { width, height } = el.getBoundingClientRect();
    if (width !== stageSizeRef.current.width || height !== stageSizeRef.current.height) {
      stageSizeRef.current = { width, height };
      setStageSize({ width, height });
      resetPinchZoomRef.current();
    }
  }, []);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    measureStage();
    if (stageRef.current) {
      resizeObserver = new ResizeObserver(measureStage);
      resizeObserver.observe(stageRef.current);
    }

    return () => {
      resizeObserver?.disconnect();
      resizeObserver = null;
      chromeTapRef.current = null;
      window.clearTimeout(pipSnapTimerRef.current);
    };
  }, [measureStage]);

  return (
    <div
      ref={rootRef}
      className={['grid-layout-mobile', chromeVisible ? 'is-chrome' : '', className].filter(Boolean).join(' ')}
      style={style}
      onPointerDown={onChromePointerDown}
      onPointerUp={onChromePointerUp}
      onPointerCancel={onChromePointerCancel}
    >
      <div
        ref={stageRef}
        className="grid-layout-mobile-body"
      >
        <TUISwiper
          ref={swiperRef}
          modelValue={requestedPage}
          indicator={false}
          gap={8}
          onUpdateModelValue={setRequestedPage}
          onChange={revealChrome}
        >
          {pages.map(pageView => (
            <TUISwiperItem
              key={pageView.page}
            >
              <div className="grid-layout-mobile-page">
                <div
                  className={[
                    'grid-layout-mobile-content',
                    pageView.fill ? 'is-fill' : '',
                    pageView.sharePage ? 'is-share-page' : '',
                  ].filter(Boolean).join(' ')}
                  style={tileStyle(pageView)}
                  onPointerDown={holdZoomedShare}
                >
                  {pageView.items.map((streamInfo, index) => (
                    <div
                      key={`${pageView.page}_${streamInfo.participant.userId}_${streamInfo.streamType}`}
                      ref={tile => bindScreenTile(tile, streamInfo, pageView.page === view.page)}
                      className={[
                        'grid-layout-mobile-tile',
                        pageView.centerLast && index === pageView.items.length - 1 ? 'is-centered' : '',
                        pageView.centerLastPair && index >= 3 ? 'is-pair-shifted' : '',
                        pageView.sharePage && streamInfo.streamType === VideoStreamType.Screen ? 'is-zoomable' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <div
                        className={
                          isCameraOff(streamInfo)
                            ? 'grid-layout-mobile-video is-hidden'
                            : 'grid-layout-mobile-video'
                        }
                      >
                        <RoomParticipantView
                          participant={streamInfo.participant}
                          streamType={streamInfo.streamType}
                          fillMode={streamInfo.streamType === VideoStreamType.Screen ? FillMode.Fit : FillMode.Fill}
                          lazyLoad={tileLazyLoad(pageView.page)}
                        />
                      </div>
                      {participantViewUISlot?.({
                        participant: streamInfo.participant,
                        streamType: streamInfo.streamType,
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </TUISwiperItem>
          ))}
        </TUISwiper>

        {paged && (
          <div className="grid-layout-mobile-pager">
            <button
              className="grid-layout-mobile-page-btn"
              type="button"
              aria-label={t('RoomView.PrevPage')}
              disabled={view.page <= 0}
              onClick={() => shiftPage(-1)}
              onPointerDown={event => event.stopPropagation()}
            >
              <IconChevron className="grid-layout-mobile-page-icon is-prev" size={14} />
            </button>
            <button
              className="grid-layout-mobile-page-btn"
              type="button"
              aria-label={t('RoomView.NextPage')}
              disabled={view.page >= view.pages - 1}
              onClick={() => shiftPage(1)}
              onPointerDown={event => event.stopPropagation()}
            >
              <IconChevron className="grid-layout-mobile-page-icon is-next" size={14} />
            </button>
          </div>
        )}
      </div>
      {paged && (
        <div className="grid-layout-mobile-page-ind">
          {view.page + 1}
          {' / '}
          {view.pages}
        </div>
      )}

      {view.sharePage && sharer && (
        <>
          <div className="grid-layout-mobile-share-who">
            <IconShare size={12} />
            <span className="grid-layout-mobile-share-who-text">{t('RoomView.SharingBy', { name: sharerName })}</span>
          </div>

          {pipParticipant && (
            <div
              ref={pipRef}
              className={['grid-layout-mobile-pip', pipSnapping ? 'is-snapping' : ''].filter(Boolean).join(' ')}
              role="group"
              style={pipStyle}
              aria-label={pipName}
              onPointerDown={(event) => {
                event.stopPropagation();
                handlePipPointerDown(event);
              }}
              onPointerMove={handlePipPointerMove}
              onPointerUp={handlePipPointerUp}
              onPointerCancel={handlePipPointerUp}
              onTransitionEnd={(event) => {
                if (event.target === event.currentTarget) {
                  setPipSnapping(false);
                }
              }}
            >
              <div
                className={
                  isCameraOff({ participant: pipParticipant, streamType: VideoStreamType.Camera })
                    ? 'grid-layout-mobile-video is-hidden'
                    : 'grid-layout-mobile-video'
                }
              >
                <RoomParticipantView
                  participant={pipParticipant}
                  streamType={VideoStreamType.Camera}
                  fillMode={FillMode.Fill}
                  lazyLoad={{ enable: false }}
                />
              </div>
              {participantViewUISlot?.({
                participant: pipParticipant,
                streamType: VideoStreamType.Camera,
                inPip: true,
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default GridLayoutMobile;
