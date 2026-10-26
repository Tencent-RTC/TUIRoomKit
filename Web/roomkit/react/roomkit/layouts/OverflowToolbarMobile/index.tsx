import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { IconMore, TUIPopup } from '../../base';
import { useI18n } from '../../i18n';
import ToolbarButtonMobile from '../ToolbarButtonMobile/ToolbarButtonMobile';
import OverflowItemMobile from './OverflowItemMobile';
import { measureMobileAvailableWidth, resolveMobileOverflow } from './resolveMobileOverflow';
import './index.scss';

export interface OverflowToolbarMobileProps {
  gap?: number;
  /** Every phone toolbar control is a circle of this size; see ToolbarButtonMobile */
  itemWidth?: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function OverflowToolbarMobile(props: OverflowToolbarMobileProps) {
  const {
    gap = 12,
    itemWidth = 44,
    children,
    className,
    style,
  } = props;

  const { t } = useI18n();

  const barRef = useRef<HTMLDivElement | null>(null);
  // Grid element state (not a plain ref) so items re-render once the sheet mounts it.
  const [gridElement, setGridElement] = useState<HTMLElement | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [presence, setPresence] = useState<Record<number, boolean>>({});
  const [availableWidth, setAvailableWidth] = useState(Number.POSITIVE_INFINITY);

  const items = Children.toArray(children);

  function setPresent(index: number, present: boolean) {
    setPresence(previous => (previous[index] === present ? previous : { ...previous, [index]: present }));
  }

  const presentIndexes = Object.keys(presence)
    .map(Number)
    .filter(index => presence[index])
    .sort((a, b) => a - b);

  const overflow = resolveMobileOverflow(presentIndexes.length, availableWidth, itemWidth, gap);

  const overflowedIndexes = new Set(presentIndexes.slice(overflow.visible));
  const showMore = overflow.more;

  // The sheet vanishes as soon as nothing is pushed out anymore.
  useEffect(() => {
    if (!showMore) {
      setMoreOpen(false);
    }
  }, [showMore]);

  const measureRef = useRef(() => {});
  measureRef.current = () => {
    const bar = barRef.current;
    const parent = bar?.parentElement;
    if (!bar || !parent) {
      return;
    }
    const sheetStyle = getComputedStyle(parent);
    const contentWidth = parent.clientWidth - parseFloat(sheetStyle.paddingLeft) - parseFloat(sheetStyle.paddingRight);
    const siblingWidths = Array.from(parent.children)
      .filter((child): child is HTMLElement => child instanceof HTMLElement && child !== bar)
      .map(child => child.getBoundingClientRect().width)
      .filter(width => width > 0);
    setAvailableWidth(measureMobileAvailableWidth(contentWidth, siblingWidths, parseFloat(sheetStyle.columnGap) || 0));
  };

  useEffect(() => {
    const parent = barRef.current?.parentElement;
    if (!parent) {
      return undefined;
    }
    const observer = new ResizeObserver(() => measureRef.current());
    observer.observe(parent);
    // Measure once after the bar is laid out, like Vue's nextTick flush.
    const frame = requestAnimationFrame(() => measureRef.current());
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  /** Only an action closes the sheet; a tap on the padding between cells does not. */
  function closeOnAction(event: { target: EventTarget | null }) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[role="button"], button')) {
      setMoreOpen(false);
    }
  }

  return (
    <div
      ref={barRef}
      className={['overflow-toolbar-mobile', className ?? ''].filter(Boolean).join(' ')}
      style={{ gap: `${gap}px`, ...style }}
    >
      {items.map((node, index) => (
        <OverflowItemMobile
          key={isValidElement(node) ? node.key ?? index : index}
          overflowed={overflowedIndexes.has(index)}
          target={gridElement}
          order={index}
          onUpdatePresent={present => setPresent(index, present)}
        >
          {node}
        </OverflowItemMobile>
      ))}

      {showMore && (
        <ToolbarButtonMobile
          label={t('Room.More')}
          active={moreOpen}
          pressed={moreOpen}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          <IconMore />
        </ToolbarButtonMobile>
      )}

      <TUIPopup
        open={moreOpen}
        height="auto"
        onUpdateOpen={setMoreOpen}
      >
        <div
          ref={(element: HTMLElement | null) => {
            setGridElement(element);
          }}
          className="overflow-toolbar-mobile-grid"
          onClickCapture={closeOnAction}
        />
      </TUIPopup>
    </div>
  );
}

export default OverflowToolbarMobile;
