/**
 * Constrained lists (fixed height / maxRows) always use the windowed row
 * template. Crossing the viewport must not swap DOM trees — that remounts
 * every row, reloads images/files, and can OOM the renderer.
 */
export function useWindowedRows(constrained: boolean): boolean {
  return constrained;
}

/** Skip collapsed or hidden measurements so display:none cannot write 0/1px heights. */
export function canCommitRowHeight(options: {
  viewportHeight: number;
  displayed: boolean;
  measuredHeight: number;
}): boolean {
  if (!options.displayed || options.viewportHeight <= 0) {
    return false;
  }
  return options.measuredHeight > 1;
}

/** Keep the last positive viewport while the scroller is hidden (display:none). */
export function nextViewportHeight(options: {
  current: number;
  measured: number;
  displayed: boolean;
}): number {
  if (!options.displayed || options.measured <= 0) {
    return options.current;
  }
  return options.measured;
}

/** A bottom pin needs a laid-out scroller; otherwise wait until it is shown. */
export function shouldDeferBottomPin(displayed: boolean, viewportHeight: number): boolean {
  return !displayed || viewportHeight <= 0;
}

/**
 * Upward scroll stops stick-to-bottom only when the user moved the list.
 * Hiding the scroller, a pin, or the browser clamping after the viewport grows
 * must not count.
 */
export function shouldBreakFollow(options: {
  pinning: boolean;
  layoutPinPending: boolean;
  displayed: boolean;
  nextOffset: number;
  previousOffset: number;
  viewportGrew: boolean;
}): boolean {
  if (
    options.pinning
    || options.layoutPinPending
    || !options.displayed
    || options.viewportGrew
  ) {
    return false;
  }
  return options.nextOffset + 0.5 < options.previousOffset;
}
