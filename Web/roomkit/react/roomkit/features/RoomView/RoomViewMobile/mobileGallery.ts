/**
 * Mobile gallery rules, kept free of React and AtomicX so they can be tested on their own.
 *
 * The phone grid holds 3 columns by 2 rows of 9:16 tiles. A remote share owns page 0 by
 * itself and the people start on page 1; the local share is the first cell of the grid.
 */

export const MOBILE_MAX_COLUMN = 3;
export const MOBILE_MAX_ROW = 2;
export const MOBILE_PAGE_SIZE = MOBILE_MAX_COLUMN * MOBILE_MAX_ROW;
/** Width over height of a phone tile. */
export const MOBILE_TILE_RATIO = 9 / 16;

export interface MobileGridPack {
  columns: number;
  rows: number;
}

/**
 * Columns follow min(ceil(sqrt(n)), 3) and rows ceil(n / columns): 2 people sit 2 x 1,
 * 3 and 4 sit 2 x 2, 5 and 6 sit 3 x 2. A paged grid keeps the full 3 x 2 on every page
 * so the last page does not grow its tiles.
 */
export function packMobileGrid(count: number, lockFull: boolean): MobileGridPack {
  if (lockFull) {
    return { columns: MOBILE_MAX_COLUMN, rows: MOBILE_MAX_ROW };
  }
  const n = Math.max(1, Math.min(count, MOBILE_PAGE_SIZE));
  const columns = Math.min(MOBILE_MAX_COLUMN, Math.ceil(Math.sqrt(n)));
  const rows = Math.min(MOBILE_MAX_ROW, Math.ceil(n / columns));
  return { columns, rows };
}

export interface MobilePageInput<T> {
  /** Camera streams in display order. */
  cameras: T[];
  /** The screen stream, if anyone is sharing. */
  screen: T | null;
  /** True when the sharer is someone other than the local user. */
  remoteShare: boolean;
  /** Requested page; it is clamped to the pages that exist. */
  page: number;
}

export interface MobilePage<T> {
  items: T[];
  /** The clamped page index actually shown. */
  page: number;
  pages: number;
  /** Page 0 of a remote share: the share alone, filling the stage. */
  sharePage: boolean;
  /** More streams than one page holds, so every page keeps the full 3 x 2 size. */
  lockFull: boolean;
  /** One stream on an unpaged grid, or the share page: drop the 9:16 lock and fill. */
  fill: boolean;
  /** Exactly three on an unpaged grid sit 2 + 1 with the last one centered. */
  centerLast: boolean;
  /** Exactly five on an unpaged grid sit 3 + 2 with the last two centered as a pair. */
  centerLastPair: boolean;
  columns: number;
  rows: number;
}

export function paginateMobileStreams<T>(input: MobilePageInput<T>): MobilePage<T> {
  const { cameras, screen, remoteShare } = input;
  const watching = remoteShare && !!screen;
  const streams = !watching && screen ? [screen, ...cameras] : cameras;
  const streamPages = Math.ceil(streams.length / MOBILE_PAGE_SIZE);
  const pages = watching ? 1 + streamPages : Math.max(1, streamPages);
  const page = Math.min(pages - 1, Math.max(0, Math.floor(input.page) || 0));

  if (watching && page === 0) {
    return {
      items: [screen as T],
      page,
      pages,
      sharePage: true,
      lockFull: false,
      fill: true,
      centerLast: false,
      centerLastPair: false,
      columns: 1,
      rows: 1,
    };
  }

  const streamPage = watching ? page - 1 : page;
  const items = streams.slice(streamPage * MOBILE_PAGE_SIZE, (streamPage + 1) * MOBILE_PAGE_SIZE);
  const lockFull = streams.length > MOBILE_PAGE_SIZE;
  const { columns, rows } = packMobileGrid(items.length, lockFull);
  return {
    items,
    page,
    pages,
    sharePage: false,
    lockFull,
    fill: !lockFull && items.length === 1,
    centerLast: !lockFull && items.length === 3,
    centerLastPair: !lockFull && items.length === 5,
    columns,
    rows,
  };
}

/**
 * A different remote sharer sends the viewer back to the share page. The same sharer
 * reported again, a local share, or the share ending keeps the current page.
 */
export function pageAfterSharerChange(previousRemoteSharer: string, nextRemoteSharer: string, page: number): number {
  if (nextRemoteSharer && nextRemoteSharer !== previousRemoteSharer) {
    return 0;
  }
  return page;
}

/**
 * A head count change sends the viewer back to page 0, except a single join, which keeps
 * the page and only nudges the pager. A viewer who has left the page of a share stays put.
 */
export function pageAfterRosterChange(previousCount: number, nextCount: number, sharing: boolean, page: number): number {
  if (nextCount === previousCount || nextCount === previousCount + 1) {
    return page;
  }
  if (sharing && page > 0) {
    return page;
  }
  return 0;
}

export interface MobileTileSize {
  width: number;
  height: number;
}

/** Largest 9:16 tile that fits columns x rows into the box once the gaps are taken out. */
export function fitMobileTile(
  boxWidth: number,
  boxHeight: number,
  columns: number,
  rows: number,
  gap: number,
): MobileTileSize {
  if (boxWidth < 2 || boxHeight < 2 || columns < 1 || rows < 1) {
    return { width: 0, height: 0 };
  }
  const widthFromWidth = (boxWidth - (columns - 1) * gap) / columns;
  const heightFromHeight = (boxHeight - (rows - 1) * gap) / rows;
  const width = Math.max(0, Math.floor(Math.min(widthFromWidth, heightFromHeight * MOBILE_TILE_RATIO)));
  return { width, height: Math.floor(width / MOBILE_TILE_RATIO) };
}
