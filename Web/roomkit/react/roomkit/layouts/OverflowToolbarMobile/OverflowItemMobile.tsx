import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './OverflowItemMobile.scss';

export interface OverflowItemMobileProps {
  overflowed: boolean;
  /** Grid inside the more sheet; null while the sheet is closed */
  target?: HTMLElement | null;
  /** Slot position, so the grid keeps toolbar order whatever order items arrive in */
  order?: number;
  onUpdatePresent?: (present: boolean) => void;
  children?: ReactNode;
}

/**
 * The control keeps one instance wherever it sits, so unread counts and pending
 * confirms survive the move between the bar and the more sheet: the React tree
 * position never changes, only the DOM node travels through a portal.
 */
export function OverflowItemMobile(props: OverflowItemMobileProps) {
  const {
    overflowed,
    target = null,
    order = 0,
    onUpdatePresent,
    children,
  } = props;

  const controlRef = useRef<HTMLDivElement | null>(null);
  const [label, setLabel] = useState('');
  const [present, setPresent] = useState(false);
  const inSheet = overflowed && !!target;
  // Back in the bar while the sheet is closed, but it must not take a slot there.
  const stashed = overflowed && !target;

  // The observer is bound once; the reporting callback reads the latest closure here.
  const reportRef = useRef(onUpdatePresent);
  reportRef.current = onUpdatePresent;
  const presentRef = useRef(present);
  presentRef.current = present;

  function sync() {
    const control = controlRef.current;
    const element = control?.firstElementChild as HTMLElement | null | undefined;
    setLabel(element?.getAttribute('aria-label')
      || element?.querySelector('[aria-label]')?.getAttribute('aria-label')
      || '');
    // A control hidden by its own conditional (recording for a plain member) leaves no element behind.
    const next = !!element;
    if (next !== presentRef.current) {
      presentRef.current = next;
      setPresent(next);
      reportRef.current?.(next);
    }
  }

  useEffect(() => {
    const control = controlRef.current;
    if (!control) {
      return undefined;
    }
    const observer = new MutationObserver(sync);
    observer.observe(control, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label'],
    });
    sync();

    return () => {
      observer.disconnect();
      if (presentRef.current) {
        presentRef.current = false;
        reportRef.current?.(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = (
    <div
      className={[
        'overflow-item-mobile',
        inSheet ? 'is-in-sheet' : '',
        stashed ? 'is-stashed' : '',
        !present ? 'is-empty' : '',
      ].filter(Boolean).join(' ')}
      style={inSheet ? { order } : undefined}
    >
      <div ref={controlRef} className="overflow-item-mobile-control">
        {children}
      </div>
      {inSheet && <span className="overflow-item-mobile-label">{label}</span>}
    </div>
  );

  if (inSheet && target) {
    return createPortal(content, target);
  }
  return content;
}

export default OverflowItemMobile;
