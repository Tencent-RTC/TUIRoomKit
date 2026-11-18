import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { DependencyList } from 'react';

function sectionContentHeight(section: HTMLElement | null): number {
  if (!section) {
    return 0;
  }
  const heading = section.querySelector('.participant-panel-heading');
  const rows = section.querySelector('.participant-panel-rows');
  const styles = getComputedStyle(section);
  return Number.parseFloat(styles.paddingTop)
    + Number.parseFloat(styles.borderTopWidth)
    + (heading instanceof HTMLElement ? heading.offsetHeight : 0)
    + (rows instanceof HTMLElement ? rows.scrollHeight : 0);
}

/**
 * Splits the panel body between the joined and pending groups. A group is
 * "tall" when its natural content would exceed half the body; only tall groups
 * grow, and both are capped at half when both are tall.
 * `content` lists whatever changes the sections' natural height.
 */
export function useSectionFlex(content: DependencyList) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const joinedSectionRef = useRef<HTMLElement | null>(null);
  const pendingSectionRef = useRef<HTMLElement | null>(null);
  const [joinedTall, setJoinedTall] = useState(false);
  const [pendingTall, setPendingTall] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const observedRef = useRef<Array<HTMLElement | null>>([]);

  const syncSectionFlex = useCallback(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }
    const cap = body.clientHeight / 2;
    setJoinedTall(sectionContentHeight(joinedSectionRef.current) > cap);
    setPendingTall(sectionContentHeight(pendingSectionRef.current) > cap);
  }, []);

  // A layout effect, so the observer exists before the observing effect below runs on mount.
  useLayoutEffect(() => {
    resizeObserverRef.current = new ResizeObserver(syncSectionFlex);
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      observedRef.current = [];
    };
  }, [syncSectionFlex]);

  // Sections mount and unmount with their content, which swaps the observed elements.
  useLayoutEffect(() => {
    const resizeObserver = resizeObserverRef.current;
    const elements = [bodyRef.current, joinedSectionRef.current, pendingSectionRef.current];
    if (resizeObserver && elements.some((element, index) => element !== observedRef.current[index])) {
      resizeObserver.disconnect();
      elements.forEach((element) => {
        if (element) {
          resizeObserver.observe(element);
        }
      });
      observedRef.current = elements;
    }
    syncSectionFlex();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, content);

  return {
    bodyRef,
    joinedSectionRef,
    pendingSectionRef,
    joinedTall,
    pendingTall,
    isBothTall: joinedTall && pendingTall,
  };
}
