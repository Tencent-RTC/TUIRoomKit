import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import classNames from 'classnames';
import { MoreButtonH5 } from './MoreButtonH5';
import styles from './ExpandFooterH5.module.scss';

export interface ExpandFooterH5Props {
  children?: ReactNode;
}

const BUTTON_ITEM_WIDTH = 52;
const BUTTON_ITEM_GAP = 10;
const MORE_BUTTON_WIDTH = 33;

function calculateMaxItems(width: number): number {
  if (width <= 0) return 0;
  return Math.floor(
    (width + BUTTON_ITEM_GAP) / (BUTTON_ITEM_WIDTH + BUTTON_ITEM_GAP),
  );
}

// Vue reference: ExpandFooterH5/index.vue.
export function ExpandFooterH5({ children }: ExpandFooterH5Props) {
  const controlBarRef = useRef<HTMLDivElement | null>(null);
  const controlButtonsRef = useRef<HTMLDivElement | null>(null);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const calculateButtonsWidth = useCallback(() => {
    const bar = controlBarRef.current;
    const buttons = controlButtonsRef.current;
    if (!bar || !buttons) return;

    const width = bar.offsetWidth;
    const itemsCount = buttons.children.length;
    const maxItems = calculateMaxItems(width);
    let showCount = itemsCount;
    if (maxItems < itemsCount) {
      showCount = calculateMaxItems(
        width - MORE_BUTTON_WIDTH - BUTTON_ITEM_GAP,
      );
      setShowMoreButton(true);
    } else {
      setShowMoreButton(false);
      setShowMoreMenu(false);
    }
    buttons.style.width = `${
      showCount * BUTTON_ITEM_WIDTH + Math.max(0, showCount - 1) * BUTTON_ITEM_GAP
    }px`;
  }, []);

  useLayoutEffect(() => {
    calculateButtonsWidth();
  }, [calculateButtonsWidth, children]);

  useEffect(() => {
    const bar = controlBarRef.current;
    const buttons = controlButtonsRef.current;
    if (!bar || !buttons) return;

    const resizeObserver = new ResizeObserver(() => calculateButtonsWidth());
    resizeObserver.observe(bar);
    const mutationObserver = new MutationObserver(() =>
      calculateButtonsWidth(),
    );
    mutationObserver.observe(buttons, { childList: true, subtree: false });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [calculateButtonsWidth]);

  return (
    <div
      className={classNames(styles.expandFooterH5, {
        [styles.showMoreMenu]: showMoreMenu,
      })}
    >
      <div
        ref={controlBarRef}
        className={classNames(styles.controlBar, {
          [styles.hideMoreMenu]: !showMoreMenu,
        })}
      >
        <div ref={controlButtonsRef} className={styles.controlButtons}>
          {children}
        </div>
        {showMoreButton && (
          <MoreButtonH5
            showMoreMenu={showMoreMenu}
            onToggleMoreMenu={setShowMoreMenu}
          />
        )}
      </div>
    </div>
  );
}
