import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent, PointerEvent, Ref } from 'react';
import { IconClose, IconSettings, IconTranscriptDoc, TUITooltip } from '../../../base';
import { useI18n } from '../../../i18n';
import { useASRState } from '../useASRState';
import { useSubtitleViewState } from '../useSubtitleViewState';
import SubtitleSettings from '../TranscriptList/SubtitleSettings';
import { useCaptionDockChrome } from './useCaptionDockChrome';
import { useCaptionDockPosition } from './useCaptionDockPosition';
import { useCaptionDockResize } from './useCaptionDockResize';
import Subtitle from './Subtitle';
import './CaptionOverlay.scss';

const SETTINGS_POPOVER_HEIGHT = 320;
const SETTINGS_POPOVER_GAP = 8;

export interface CaptionOverlayProps {
  transcriptOpen?: boolean;
  onToggleTranscript?: () => void;
}

export function CaptionOverlay(props: CaptionOverlayProps) {
  const { transcriptOpen, onToggleTranscript } = props;
  const { t } = useI18n();
  const {
    fontSize,
    dockPosition,
    dockWidth,
    setDockWidth,
    setDockPosition,
    hideCaptionOverlay,
  } = useSubtitleViewState();
  const {
    targetLanguage,
    asrOn,
    captionDisplayMode,
  } = useASRState();

  const dockRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsPlacement, setSettingsPlacement] = useState<'top' | 'bottom'>('top');
  const blockPositionSync = useRef(false);
  const isSettingsOpenRef = useRef(false);
  const syncPositionRef = useRef<() => void>(() => {});
  isSettingsOpenRef.current = isSettingsOpen;

  const {
    dockStyle,
    isDragging,
    position,
    setPosition,
    bottomGap,
    syncPosition,
  } = useCaptionDockPosition(containerRef, dockRef, {
    handle: event => !((event.target as HTMLElement | null)?.closest('button, .cap-settings')),
    beforeSync: () => !blockPositionSync.current,
  });

  const {
    isResizing,
    startResize,
  } = useCaptionDockResize({
    containerRef,
    dockRef,
    dockWidth,
    setDockWidth,
    position,
    setPosition,
    onResizeStart: () => {
      blockPositionSync.current = true;
      setIsSettingsOpen(false);
    },
    onResizeEnd: () => {
      blockPositionSync.current = false;
      queueMicrotask(() => {
        syncPositionRef.current();
      });
    },
  });

  // Restore the saved dock position once. Later drags write back to view state.
  const [initialDockPosition] = useState(dockPosition);
  const seededPosition = useRef(false);
  useLayoutEffect(() => {
    if (seededPosition.current) {
      return;
    }
    seededPosition.current = true;
    setPosition(initialDockPosition);
  }, [initialDockPosition, setPosition]);

  const setDockPositionRef = useRef(setDockPosition);
  setDockPositionRef.current = setDockPosition;
  const skipPreSeedWrite = useRef(initialDockPosition != null);
  useEffect(() => {
    if (skipPreSeedWrite.current && position == null) {
      skipPreSeedWrite.current = false;
      return;
    }
    skipPreSeedWrite.current = false;
    setDockPositionRef.current(position);
  }, [position]);

  syncPositionRef.current = syncPosition;

  useLayoutEffect(() => {
    containerRef.current = dockRef.current?.closest<HTMLElement>('.conference-stage')
      ?? dockRef.current?.parentElement
      ?? null;
    syncPositionRef.current();
  }, []);

  useEffect(() => {
    function onDocumentPointerDown(event: globalThis.PointerEvent) {
      const target = event.target as Node | null;
      if (!isSettingsOpenRef.current || !target) {
        return;
      }
      if (actionsRef.current?.contains(target)) {
        return;
      }
      setIsSettingsOpen(false);
    }
    document.addEventListener('pointerdown', onDocumentPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown);
    };
  }, []);

  const skipAsrWatch = useRef(true);
  useEffect(() => {
    if (skipAsrWatch.current) {
      skipAsrWatch.current = false;
      return;
    }
    if (!asrOn) {
      setIsSettingsOpen(false);
    }
  }, [asrOn]);

  function resetMovedPosition(event: MouseEvent<HTMLDivElement>) {
    const { target } = event;
    if (target instanceof Element && target.closest('button, a, .cap-settings, .cap-dock-actions')) {
      return;
    }
    event.preventDefault();
    setIsResetting(true);
    setPosition(null);
    setDockWidth(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsResetting(false);
      });
    });
  }

  const mergedDockStyle = {
    '--cap-dock-bottom': `${bottomGap}px`,
    ...dockStyle,
    ...(dockWidth != null ? { width: `${dockWidth}px` } : {}),
  } as CSSProperties;

  const isOverlayHeld = isSettingsOpen || isHovered || isDragging || isResizing;
  const {
    isStoppedHint,
    showDockActions,
    isIdle,
    wake,
  } = useCaptionDockChrome(isOverlayHeld);
  const areActionsVisible = isHovered || isDragging || isResizing || isSettingsOpen;

  function handlePointerEnter() {
    setIsHovered(true);
    wake();
  }

  function handleResizePointerDown(event: PointerEvent<HTMLButtonElement>, edge: 'left' | 'right') {
    wake();
    startResize(event.nativeEvent, edge);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    wake();
    if ((event.target as HTMLElement | null)?.closest('button, .cap-settings')) {
      return;
    }
    setIsSettingsOpen(false);
  }

  function resolveSettingsPlacement() {
    const container = containerRef.current;
    const trigger = settingsRef.current;
    if (!container || !trigger) {
      setSettingsPlacement('top');
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const spaceAbove = triggerRect.top - containerRect.top;
    const spaceBelow = containerRect.bottom - triggerRect.bottom;
    const need = SETTINGS_POPOVER_HEIGHT + SETTINGS_POPOVER_GAP;
    setSettingsPlacement(spaceAbove >= need || spaceAbove >= spaceBelow ? 'top' : 'bottom');
  }

  function toggleSettings() {
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return;
    }
    resolveSettingsPlacement();
    setIsSettingsOpen(true);
    wake();
  }

  return (
    <div
      ref={dockRef as Ref<HTMLDivElement>}
      className={[
        'conference-caption',
        'cap-dock',
        !position ? 'cap-dock-centered' : '',
        isDragging ? 'cap-dock-dragging' : '',
        isResizing ? 'cap-dock-resizing' : '',
        dockWidth != null ? 'cap-dock-custom-width' : '',
        isIdle ? 'cap-dock-idle' : '',
        isResetting ? 'cap-dock-resetting' : '',
      ].filter(Boolean).join(' ')}
      style={mergedDockStyle}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={() => setIsHovered(false)}
      onDoubleClick={resetMovedPosition}
    >
      <div className="cap-dock-handle" aria-hidden="true" />
      <div ref={actionsRef}>
        {showDockActions
          ? (
            <div
              className={[
                'cap-dock-actions',
                areActionsVisible ? 'is-visible' : '',
              ].filter(Boolean).join(' ')}
            >
              <TUITooltip
                content={t('AITools.RealtimeMessageList')}
                placement="bottom"
                disabled={Boolean(transcriptOpen)}
              >
                <button
                  className={[
                    'cap-dock-action',
                    transcriptOpen ? 'is-active' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  aria-label={t('AITools.RealtimeMessageList')}
                  aria-pressed={Boolean(transcriptOpen)}
                  onClick={() => onToggleTranscript?.()}
                >
                  <IconTranscriptDoc size={14} />
                </button>
              </TUITooltip>
              <div ref={settingsRef} className="cap-dock-settings">
                <TUITooltip
                  content={t('AITools.GroupSubtitle')}
                  placement="bottom"
                  disabled={isSettingsOpen}
                >
                  <button
                    className={[
                      'cap-dock-action',
                      isSettingsOpen ? 'is-active' : '',
                    ].filter(Boolean).join(' ')}
                    type="button"
                    aria-label={t('AITools.GroupSubtitle')}
                    aria-pressed={isSettingsOpen}
                    onClick={toggleSettings}
                  >
                    <IconSettings size={14} />
                  </button>
                </TUITooltip>
                {isSettingsOpen
                  ? <SubtitleSettings placement={settingsPlacement} />
                  : null}
              </div>
              <TUITooltip
                content={t('AITools.SubtitlesClose')}
                placement="bottom"
              >
                <button
                  className="cap-dock-action"
                  type="button"
                  aria-label={t('AITools.SubtitlesClose')}
                  onClick={hideCaptionOverlay}
                >
                  <IconClose size={14} />
                </button>
              </TUITooltip>
            </div>
          )
          : null}
      </div>
      <button
        className="cap-dock-resize cap-dock-resize-left"
        type="button"
        tabIndex={-1}
        aria-label={t('ASRTools.ResizeCaptionWidth')}
        onPointerDown={event => handleResizePointerDown(event, 'left')}
      />
      <button
        className="cap-dock-resize cap-dock-resize-right"
        type="button"
        tabIndex={-1}
        aria-label={t('ASRTools.ResizeCaptionWidth')}
        onPointerDown={event => handleResizePointerDown(event, 'right')}
      />
      {(asrOn || isStoppedHint)
        ? (
          <Subtitle
            key={isStoppedHint ? 'stopped' : 'live'}
            targetLanguage={targetLanguage}
            captionMode={captionDisplayMode}
            fontSize={fontSize}
            pinned={isOverlayHeld}
            placeholderKey={isStoppedHint ? 'ASRTools.SubtitleStoppedPlaceholder' : 'ASRTools.SubtitlePlaceholder'}
            forcePlaceholder={isStoppedHint}
          />
        )
        : null}
    </div>
  );
}

export default CaptionOverlay;
