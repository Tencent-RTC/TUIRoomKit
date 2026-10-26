import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { IconChatVideo, TUIDialog, TUIToast } from '../../../base';
import { t, useI18n } from '../../../base/i18n';
import './MediaPreview.scss';

export interface MediaPreviewProps {
  /** Address opened in the preview. */
  src: string;
  kind?: 'image' | 'video';
  /** Thumbnail. Images fall back to `src`. */
  poster?: string;
  duration?: string;
  mobile?: boolean;
}

export function MediaPreview(props: MediaPreviewProps) {
  const {
    src,
    kind = 'image',
    poster = '',
    duration = '',
    mobile = false,
  } = props;

  useI18n();
  const [open, setOpen] = useState(false);
  const [scale, setScaleState] = useState(1);
  const scaleRef = useRef(1);
  const [offsetX, setOffsetXState] = useState(0);
  const offsetXRef = useRef(0);
  const [offsetY, setOffsetYState] = useState(0);
  const offsetYRef = useRef(0);
  const local = useRef({
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragOriginX: 0,
    dragOriginY: 0,
  }).current;

  const thumbSrc = poster || src;
  const dialogTitle = kind === 'video' ? t('RoomChat.video_preview') : t('RoomChat.image_preview');

  function setScale(value: number) {
    scaleRef.current = value;
    setScaleState(value);
  }

  function setOffsetX(value: number) {
    offsetXRef.current = value;
    setOffsetXState(value);
  }

  function setOffsetY(value: number) {
    offsetYRef.current = value;
    setOffsetYState(value);
  }

  function resetView() {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  }

  function openPreview() {
    if (!src) {
      TUIToast.error(t('RoomChat.media_unavailable'));
      return;
    }
    resetView();
    setOpen(true);
  }

  function onDialogOpen(next: boolean) {
    setOpen(next);
    if (!next) resetView();
  }

  // Created once so the drag-end handler can unbind its own listeners.
  const dragHandlersRef = useRef<{
    move: (event: MouseEvent) => void;
    end: () => void;
  } | null>(null);
  if (dragHandlersRef.current === null) {
    dragHandlersRef.current = {
      move: (event: MouseEvent) => {
        if (!local.dragging) return;
        setOffsetX(local.dragOriginX + (event.clientX - local.dragStartX) / scaleRef.current);
        setOffsetY(local.dragOriginY + (event.clientY - local.dragStartY) / scaleRef.current);
      },
      end: () => {
        local.dragging = false;
        const handlers = dragHandlersRef.current;
        if (handlers) {
          window.removeEventListener('mousemove', handlers.move);
          window.removeEventListener('mouseup', handlers.end);
        }
      },
    };
  }
  const dragHandlers = dragHandlersRef.current;

  const handlersRef = useRef({
    onWheel: (event: WheelEvent) => {
      if (kind !== 'image') return;
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const nextScale = Math.min(5, Math.max(1, scaleRef.current + delta));
      setScale(nextScale);
      if (nextScale === 1) {
        setOffsetX(0);
        setOffsetY(0);
      }
    },
    onDragStart: (event: ReactMouseEvent<HTMLImageElement>) => {
      event.preventDefault();
      if (scaleRef.current === 1) return;
      const handlers = dragHandlersRef.current;
      if (!handlers) return;
      local.dragging = true;
      local.dragStartX = event.clientX;
      local.dragStartY = event.clientY;
      local.dragOriginX = offsetXRef.current;
      local.dragOriginY = offsetYRef.current;
      window.addEventListener('mousemove', handlers.move);
      window.addEventListener('mouseup', handlers.end);
    },
  });

  useEffect(() => () => {
    local.dragging = false;
    window.removeEventListener('mousemove', dragHandlers.move);
    window.removeEventListener('mouseup', dragHandlers.end);
  }, [dragHandlers, local]);

  // React wheel listeners are passive, so preventDefault needs a native listener.
  const stageRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return undefined;
    const stage = stageRef.current;
    if (!stage) return undefined;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      handlersRef.current.onWheel(event);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={[
          'chat-media-preview',
          kind === 'video' ? 'is-video' : '',
          mobile ? 'is-mobile' : '',
        ].filter(Boolean).join(' ')}
        aria-label={kind === 'video' ? t('RoomChat.play_video') : undefined}
        onClick={(event) => {
          event.stopPropagation();
          openPreview();
        }}
      >
        {kind === 'image'
          ? (
            <img
              className="chat-media-preview-image"
              src={thumbSrc}
              alt={t('RoomChat.image_alt')}
            />
          )
          : (
            <>
              {poster && (
                <img
                  className="chat-media-preview-poster"
                  src={poster}
                  alt=""
                />
              )}
              <span className="chat-media-preview-play" aria-hidden="true">
                <IconChatVideo size={18} />
              </span>
              {duration && <span className="chat-media-preview-duration">{duration}</span>}
            </>
          )}
      </button>
      {open && (
        <TUIDialog
          open={open}
          title={dialogTitle}
          confirmText=""
          cancelText=""
          width="min(720px, calc(100% - 48px))"
          onUpdateOpen={onDialogOpen}
        >
          <div className="chat-media-preview-stage" ref={stageRef}>
            {kind === 'image'
              ? (
                <img
                  className="chat-media-preview-full"
                  src={src}
                  alt=""
                  draggable={false}
                  style={{ transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)` }}
                  onMouseDown={event => handlersRef.current.onDragStart(event)}
                />
              )
              : (
                <video
                  className="chat-media-preview-player"
                  src={src}
                  poster={poster || undefined}
                  controls
                  playsInline
                  autoPlay
                />
              )}
          </div>
        </TUIDialog>
      )}
    </>
  );
}

export default MediaPreview;
