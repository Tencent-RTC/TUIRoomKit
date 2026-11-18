import type { OverflowMenuEntry, RegisteredOverflowItem } from './overflowItem';

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

/**
 * Pairs each collapsed slot child with the registered control inside it. A child holding no
 * registered control (a widget the customer added without ToolbarButtonPC) is named by its
 * accessible label and clicked as it stands. `idOf` must give a child the same id on every
 * call, so a drilled submenu cannot slide onto another control when the window resizes.
 */
export function resolveOverflowEntries(
  collapsed: HTMLElement[],
  items: RegisteredOverflowItem[],
  idOf: (element: HTMLElement) => string,
): OverflowMenuEntry[] {
  return collapsed.map((element, index) => {
    const id = idOf(element);
    const item = items.find(candidate => element.contains(candidate.el));
    if (item) {
      const { el: _el, ...entry } = item;
      return { ...entry, id };
    }
    return {
      id,
      label: readLabel(element) || `Item ${index + 1}`,
      behavior: { select: () => element.querySelector<HTMLElement>('button, [role="button"]')?.click() },
    };
  });
}

function readLabel(element: HTMLElement): string {
  return element.getAttribute('aria-label')
    || element.querySelector<HTMLElement>('[aria-label]')?.getAttribute('aria-label')
    || element.textContent?.trim()
    || '';
}
