/** Right-to-left collapse: keep as many leading items as fit, hide the rest. */
export function resolveVisibleCount(
  widths: number[],
  availableWidth: number,
  gap: number,
): number {
  if (widths.length === 0) {
    return 0;
  }

  let used = 0;
  for (let index = 0; index < widths.length; index += 1) {
    const next = used + widths[index] + (index > 0 ? gap : 0);
    if (next > availableWidth) {
      return index;
    }
    used = next;
  }
  return widths.length;
}

/**
 * Width left for leading toolbar items.
 * Uses the parent bar so growing the window still yields a larger number after
 * items have collapsed and this cluster has shrunk to its content.
 */
export function measureAvailableWidth(
  parentContentWidth: number,
  siblingWidths: number[],
  parentGap: number,
  moreWidth: number,
  itemGap: number,
): number {
  const siblingTotal = siblingWidths.reduce((sum, width) => sum + width, 0);
  const childGaps = siblingWidths.length * parentGap;
  return Math.max(0, parentContentWidth - siblingTotal - childGaps - moreWidth - itemGap);
}

export interface OverflowMenuEntry {
  id: string;
  label: string;
  icon: string;
  /** The collapsed control paints its own menu inside the more menu. */
  hasSubmenu?: boolean;
}
