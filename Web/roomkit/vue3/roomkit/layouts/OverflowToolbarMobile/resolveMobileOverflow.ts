export interface MobileOverflow {
  /** Leading items that stay on the bar; the rest move into the more sheet. */
  visible: number;
  /** The more button only shows once something has actually been pushed out. */
  more: boolean;
}

/**
 * Every phone toolbar control is the same fixed-size circle, and a control moved
 * into the sheet no longer has its bar width, so the split is a count rather than
 * a sum of measured widths. The more button takes one slot of the same size.
 */
export function resolveMobileOverflow(
  itemCount: number,
  availableWidth: number,
  itemWidth: number,
  gap: number,
): MobileOverflow {
  const rowWidth = (count: number) => (count > 0 ? count * itemWidth + (count - 1) * gap : 0);
  if (rowWidth(itemCount) <= availableWidth) {
    return { visible: itemCount, more: false };
  }
  const slots = Math.floor((Math.max(0, availableWidth) + gap) / (itemWidth + gap));
  return { visible: Math.max(0, Math.min(itemCount, slots - 1)), more: true };
}

/** Width the parent bar leaves for this cluster once its fixed siblings are laid out. */
export function measureMobileAvailableWidth(
  parentContentWidth: number,
  siblingWidths: number[],
  parentGap: number,
): number {
  const siblingTotal = siblingWidths.reduce((sum, width) => sum + width, 0);
  return Math.max(0, parentContentWidth - siblingTotal - siblingWidths.length * parentGap);
}
