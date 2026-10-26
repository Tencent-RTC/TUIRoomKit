import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { flattenVNodes } from '../List/flattenVNodes';
import SwiperItem from './SwiperItem';
import { getSwiperGap, getSwiperSpan, getSwiperStep } from './swiperLayout';
import { swiperKey } from './types';
import type { SwiperChangeSource, SwiperContext, SwiperDirection } from './types';
import './Swiper.scss';

export interface SwiperProps {
  modelValue?: number;
  loop?: boolean;
  autoplay?: boolean;
  interval?: number;
  duration?: number;
  direction?: SwiperDirection;
  indicator?: boolean;
  height?: number | string;
  gap?: number;
  disabled?: boolean;
  onUpdateModelValue?: (index: number) => void;
  onChange?: (index: number, ctx: { source: SwiperChangeSource }) => void;
  onClick?: (index: number) => void;
  indicatorSlot?: (scope: { current: number; count: number }) => ReactNode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface SwiperExpose {
  slideTo: (targetIndex: number) => void;
  prev: () => void;
  next: () => void;
}

type TrackPointerEvent = ReactPointerEvent<HTMLDivElement>;

export const TUISwiper = forwardRef<SwiperExpose, SwiperProps>((props, ref) => {
  const {
    modelValue = 0,
    autoplay = false,
    interval = 5000,
    duration = 300,
    direction = 'horizontal',
    indicator = true,
    height,
    gap = 0,
    disabled = false,
    indicatorSlot,
    children,
    className,
    style,
  } = props;

  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const indexRef = useRef(modelValue);
  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  const lockedRef = useRef(false);
  const animatingRef = useRef(false);
  const sizeRef = useRef(0);

  const count = flattenVNodes(children).filter(node => node.type === SwiperItem).length;
  const horizontal = direction === 'horizontal';

  const latest = useRef({ props, count, horizontal });
  latest.current = { props, count, horizontal };

  const local = useRef({
    pointerId: null as number | null,
    startMain: 0,
    startCross: 0,
    startTime: 0,
    axis: null as 'main' | 'cross' | null,
    dragged: false,
    autoplayTimer: null as number | null,
    snapTimer: null as number | null,
  }).current;

  function setIndex(value: number) {
    if (indexRef.current === value) return;
    indexRef.current = value;
    forceRender();
  }

  function setOffset(value: number) {
    if (offsetRef.current === value) return;
    offsetRef.current = value;
    forceRender();
  }

  function setDragging(value: boolean) {
    if (draggingRef.current === value) return;
    draggingRef.current = value;
    forceRender();
  }

  function setLocked(value: boolean) {
    if (lockedRef.current === value) return;
    lockedRef.current = value;
    forceRender();
  }

  function setAnimating(value: boolean) {
    if (animatingRef.current === value) return;
    animatingRef.current = value;
    forceRender();
  }

  function getDuration() {
    return latest.current.props.duration ?? 300;
  }

  function measure() {
    const el = rootRef.current;
    if (!el) {
      return;
    }
    const measured = latest.current.horizontal ? el.offsetWidth : el.offsetHeight;
    if (measured === sizeRef.current) {
      return;
    }
    sizeRef.current = measured;
    forceRender();
  }

  function clamp(value: number) {
    const n = latest.current.count;
    if (n <= 0) {
      return 0;
    }
    if (latest.current.props.loop) {
      return ((value % n) + n) % n;
    }
    return Math.max(0, Math.min(value, n - 1));
  }

  function slideTo(targetIndex: number, source: SwiperChangeSource) {
    if (latest.current.props.disabled && source !== 'nav') {
      return;
    }
    const target = clamp(targetIndex);
    if (target === indexRef.current) {
      if (offsetRef.current !== 0) {
        bounce();
      }
      return;
    }
    setIndex(target);
    setOffset(0);
    setAnimating(true);
    latest.current.props.onUpdateModelValue?.(target);
    latest.current.props.onChange?.(target, { source });
    window.clearTimeout(local.snapTimer ?? undefined);
    local.snapTimer = window.setTimeout(() => {
      setAnimating(false);
    }, getDuration());
    if (source !== 'autoplay') {
      restartAutoplay();
    }
  }

  function bounce() {
    setOffset(0);
    setAnimating(true);
    window.clearTimeout(local.snapTimer ?? undefined);
    local.snapTimer = window.setTimeout(() => {
      setAnimating(false);
    }, getDuration());
  }

  function prev() {
    slideTo(indexRef.current - 1, 'nav');
  }

  function next() {
    slideTo(indexRef.current + 1, 'nav');
  }

  function mainDelta(e: TrackPointerEvent) {
    return latest.current.horizontal ? e.clientX - local.startMain : e.clientY - local.startMain;
  }

  function crossDelta(e: TrackPointerEvent) {
    return latest.current.horizontal ? e.clientY - local.startCross : e.clientX - local.startCross;
  }

  function onPointerDown(e: TrackPointerEvent) {
    if (latest.current.props.disabled || latest.current.count <= 1) {
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) {
      return;
    }
    if (!e.isPrimary) {
      // A second finger makes the gesture a pinch, not a swipe.
      if (draggingRef.current) {
        release(e);
        bounce();
        restartAutoplay();
      }
      return;
    }
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    local.pointerId = e.pointerId;
    measure();
    setDragging(true);
    setLocked(false);
    setAnimating(false);
    local.dragged = false;
    local.axis = null;
    local.startTime = Date.now();
    local.startMain = latest.current.horizontal ? e.clientX : e.clientY;
    local.startCross = latest.current.horizontal ? e.clientY : e.clientX;
    setOffset(0);
    stopAutoplay();
  }

  function onPointerMove(e: TrackPointerEvent) {
    if (!draggingRef.current || e.pointerId !== local.pointerId) {
      return;
    }
    const main = mainDelta(e);
    const cross = crossDelta(e);
    if (!local.axis) {
      if (Math.abs(main) < 8 && Math.abs(cross) < 8) {
        return;
      }
      local.axis = Math.abs(main) >= Math.abs(cross) ? 'main' : 'cross';
      setLocked(local.axis === 'main');
      if (local.axis === 'cross') {
        release(e);
        return;
      }
    }
    if (local.axis !== 'main') {
      return;
    }
    if (Math.abs(main) > 8) {
      local.dragged = true;
    }
    e.preventDefault();
    if (!latest.current.props.loop) {
      const atStart = indexRef.current === 0 && main > 0;
      const atEnd = indexRef.current === latest.current.count - 1 && main < 0;
      if (atStart || atEnd) {
        const max = sizeRef.current * 0.12;
        const resisted = max * (1 - Math.exp(-Math.abs(main) / (max * 2.5)));
        setOffset(main > 0 ? resisted : -resisted);
        return;
      }
    }
    setOffset(main);
  }

  function onPointerUp(e: TrackPointerEvent) {
    if (e.pointerId !== local.pointerId) {
      return;
    }
    if (!draggingRef.current) {
      return;
    }
    const fromMain = local.axis === 'main';
    const main = fromMain ? mainDelta(e) : 0;
    const quick = fromMain && Date.now() - local.startTime < 300 && Math.abs(main) > 50;
    release(e);
    const threshold = sizeRef.current * 0.25;
    if (fromMain && (Math.abs(main) > threshold || quick)) {
      slideTo(indexRef.current + (main < 0 ? 1 : -1), 'touch');
    } else {
      bounce();
      restartAutoplay();
    }
  }

  function onLostCapture(e: TrackPointerEvent) {
    if (e.pointerId !== local.pointerId || !draggingRef.current) {
      return;
    }
    release(e);
    bounce();
    restartAutoplay();
  }

  function release(e: TrackPointerEvent) {
    const el = e.currentTarget as HTMLElement | null;
    const id = local.pointerId;
    local.pointerId = null;
    setDragging(false);
    setLocked(false);
    local.axis = null;
    if (el && id != null && el.hasPointerCapture?.(id)) {
      el.releasePointerCapture(id);
    }
  }

  function startAutoplay() {
    stopAutoplay();
    const p = latest.current.props;
    if (!p.autoplay || p.disabled || latest.current.count <= 1) {
      return;
    }
    local.autoplayTimer = window.setInterval(() => {
      slideTo(indexRef.current + 1, 'autoplay');
    }, p.interval ?? 5000);
  }

  function stopAutoplay() {
    if (local.autoplayTimer != null) {
      window.clearInterval(local.autoplayTimer);
      local.autoplayTimer = null;
    }
  }

  function restartAutoplay() {
    if (latest.current.props.autoplay) {
      startAutoplay();
    }
  }

  const ctx = useMemo<SwiperContext>(() => ({
    wasDragged: () => local.dragged,
    reportClick: (el) => {
      const track = rootRef.current?.querySelector('.rk-swiper-track');
      if (!track) {
        return;
      }
      const items = [...track.querySelectorAll(':scope > .rk-swiper-item')];
      const i = items.indexOf(el);
      if (i >= 0) {
        latest.current.props.onClick?.(i);
      }
    },
  }), [local]);

  const modelFirstRun = useRef(true);
  useLayoutEffect(() => {
    if (modelFirstRun.current) {
      modelFirstRun.current = false;
      return;
    }
    if (modelValue === indexRef.current) {
      return;
    }
    setIndex(clamp(modelValue));
    setOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelValue]);

  const countFirstRun = useRef(true);
  useLayoutEffect(() => {
    if (countFirstRun.current) {
      countFirstRun.current = false;
      return;
    }
    if (count > 0 && indexRef.current > count - 1) {
      slideTo(count - 1, 'nav');
    }
    restartAutoplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const autoplayFirstRun = useRef(true);
  useLayoutEffect(() => {
    if (autoplayFirstRun.current) {
      autoplayFirstRun.current = false;
      return;
    }
    restartAutoplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, interval, disabled]);

  const horizontalFirstRun = useRef(true);
  useLayoutEffect(() => {
    if (horizontalFirstRun.current) {
      horizontalFirstRun.current = false;
      return;
    }
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizontal]);

  useLayoutEffect(() => {
    measure();
    restartAutoplay();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && rootRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(rootRef.current);
    }
    return () => {
      stopAutoplay();
      ro?.disconnect();
      window.clearTimeout(local.snapTimer ?? undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    slideTo: (targetIndex: number) => slideTo(targetIndex, 'nav'),
    prev,
    next,
  }));

  const index = indexRef.current;
  const pageSize = sizeRef.current;
  const rootStyle = {
    ...(height == null ? {} : { height: typeof height === 'number' ? `${height}px` : height }),
    ...(pageSize > 0 ? { '--rk-swiper-page': `${pageSize}px` } : {}),
  } as CSSProperties;
  const axisName = horizontal ? 'X' : 'Y';
  const trackGap = getSwiperGap(gap);
  const step = getSwiperStep(pageSize, trackGap);
  // A one-viewport track clips the next page, so the strip spans every page
  // and advances by one page plus the gap between pages.
  const shift = pageSize > 0 ? -index * step + offsetRef.current : offsetRef.current;
  const trackStyle: CSSProperties = {
    gap: `${trackGap}px`,
    transform: `translate${axisName}(${shift}px)`,
    transition: draggingRef.current || !animatingRef.current
      ? 'none'
      : `transform ${duration}ms var(--rk-ease)`,
  };
  if (pageSize > 0 && count > 0) {
    const span = getSwiperSpan(pageSize, count, trackGap);
    if (horizontal) {
      trackStyle.width = span;
    } else {
      trackStyle.height = span;
    }
  }

  return (
    <swiperKey.Provider value={ctx}>
      <div
        ref={rootRef}
        className={[
          'rk-swiper',
          `rk-swiper-${direction}`,
          disabled ? 'rk-swiper-disabled' : '',
          draggingRef.current ? 'rk-swiper-dragging' : '',
          lockedRef.current ? 'rk-swiper-locked' : '',
          className,
        ].filter(Boolean).join(' ')}
        style={{ ...rootStyle, ...style }}
        role="region"
        aria-roledescription="carousel"
      >
        <div
          className="rk-swiper-track"
          style={trackStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onLostPointerCapture={onLostCapture}
        >
          {children}
        </div>
        {indicator && count > 1 && (
          <div
            className="rk-swiper-dots"
            role="tablist"
          >
            {indicatorSlot != null
              ? indicatorSlot({ current: index, count })
              : Array.from({ length: count }, (_, k) => k + 1).map(i => (
                <button
                  key={i}
                  type="button"
                  className={['rk-swiper-dot', i - 1 === index ? 'rk-swiper-dot-active' : ''].filter(Boolean).join(' ')}
                  aria-current={i - 1 === index ? 'true' : undefined}
                  onClick={() => slideTo(i - 1, 'nav')}
                />
              ))}
          </div>
        )}
      </div>
    </swiperKey.Provider>
  );
});

TUISwiper.displayName = 'TUISwiper';

export default TUISwiper;
