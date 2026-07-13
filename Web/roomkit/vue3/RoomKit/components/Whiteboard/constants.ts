import type { Component } from 'vue';
import {
  IconArrow,
  IconBrush,
  IconCircle,
  IconEraser,
  IconExit,
  IconLaser,
  IconRectangle,
  IconRedo,
  IconRevoke,
  IconSelect,
  IconShape,
  IconWhiteboard as BaseIconWhiteboard,
  IconWhiteboardClear,
  IconWhiteboardSave,
} from '@tencentcloud/uikit-base-component-vue3';
import { WhiteboardTool } from 'tuikit-atomicx-vue3/room';
import type { WhiteboardToolConfig } from 'tuikit-atomicx-vue3/room';

export const WHITEBOARD_LINE_WIDTHS = [2, 4, 8, 12] as const;

// Standalone whiteboard uses a white canvas; screen annotation draws over the
// shared screen on a black (transparent-looking) canvas.
export const STANDALONE_WHITEBOARD_CANVAS_COLOR = '#FFFFFF';
export const SCREEN_ANNOTATION_CANVAS_COLOR = '#000000';

// Per-tool style (color + line width) remembered inside the toolbar.
export type WhiteboardToolStyle = Pick<WhiteboardToolConfig, 'color' | 'lineWidth'>;

export const DEFAULT_TOOL_STYLE: WhiteboardToolStyle = {
  color: '#006EFF',
  lineWidth: 4,
};

const CURSOR_SIZE = 20;

function buildToolCursor(inner: string, hotspotX: number, hotspotY: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_SIZE}" height="${CURSOR_SIZE}" viewBox="0 0 18 18" fill="none">${inner}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotspotX} ${hotspotY}, crosshair`;
}

const HALO_COLOR = '#FFFFFF';
const OUTLINE_COLOR = '#1D2029';

const penLayer = (color: string, width: number) =>
  `<path d="M9.29712 14.5575L15.4919 14.5575" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`
  + `<path d="M11.8098 3.68068C12.3596 3.99832 12.5475 4.70171 12.23 5.25166L7.00687 14.2984C6.89418 14.4936 6.72668 14.6513 6.52506 14.7521L4.27299 15.8774C3.59938 16.2139 2.80108 15.753 2.75575 15.0014L2.60427 12.4884C2.59074 12.2635 2.64358 12.0395 2.75624 11.8443L7.97939 2.79755C8.29695 2.24752 9.00081 2.05892 9.55085 2.37648L11.8098 3.68068Z" stroke="${color}" stroke-width="${width}" stroke-linejoin="round"/>`;

const eraserLayer = (color: string, width: number) =>
  `<rect x="8.22966" y="1.22372" width="8.71807" height="9.55166" rx="1.15" transform="rotate(25.9946 8.22966 1.22372)" stroke="${color}" stroke-width="${width}"/>`
  + `<path d="M15.0238 4.55828C15.5945 4.83673 15.8311 5.52528 15.5528 6.09607L10.985 15.4636C10.7923 15.8587 10.3915 16.1093 9.95196 16.1094L6.27406 16.1098C6.10012 16.1097 5.92844 16.0702 5.77195 15.9942L2.97191 14.6332C2.40028 14.3553 2.16227 13.6668 2.44079 13.0954L7.71692 2.27519C7.99528 1.70431 8.68425 1.46701 9.25513 1.74538L15.0238 4.55828Z" stroke="${color}" stroke-width="${width}" stroke-linejoin="round"/>`
  + `<path d="M8.34595 16.1086H15.799" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;

const LASER_RAYS = [
  'M9 3.99509C8.58579 3.99509 8.25 3.6593 8.25 3.24509L8.25 1.75C8.25 1.33579 8.58579 1 9 1C9.41421 1 9.75 1.33579 9.75 1.75L9.75 3.24509C9.75 3.6593 9.41421 3.99509 9 3.99509Z',
  'M3.99509 9.00024C3.99509 9.41446 3.6593 9.75024 3.24509 9.75024L1.75 9.75024C1.33579 9.75024 1 9.41446 1 9.00024C1 8.58603 1.33579 8.25024 1.75 8.25024L3.24509 8.25024C3.6593 8.25024 3.99509 8.58603 3.99509 9.00024Z',
  'M9 16.9951C8.58579 16.9951 8.25 16.6593 8.25 16.2451L8.25 14.75C8.25 14.3358 8.58579 14 9 14C9.41421 14 9.75 14.3358 9.75 14.75L9.75 16.2451C9.75 16.6593 9.41421 16.9951 9 16.9951Z',
  'M17.0001 9.00024C17.0001 9.41446 16.6643 9.75024 16.2501 9.75024L14.755 9.75024C14.3408 9.75024 14.005 9.41446 14.005 9.00024C14.005 8.58603 14.3408 8.25024 14.755 8.25024L16.2501 8.25024C16.6643 8.25024 17.0001 8.58603 17.0001 9.00024Z',
];

const laserRays = (attrs: string) =>
  LASER_RAYS.map(d => `<path fill-rule="evenodd" clip-rule="evenodd" d="${d}" ${attrs}/>`).join('');

const laserInner
  // Halo pass (white, widened strokes).
  = `<circle cx="9" cy="9" r="3.82892" stroke="${HALO_COLOR}" stroke-width="3"/>`
    + `<circle cx="9" cy="9" r="1.16856" fill="${HALO_COLOR}" stroke="${HALO_COLOR}" stroke-width="3"/>${
      laserRays(`fill="${HALO_COLOR}" stroke="${HALO_COLOR}" stroke-width="2" stroke-linejoin="round"`)
      // Dark pass (crisp icon on top).
    }<circle cx="9" cy="9" r="3.82892" stroke="${OUTLINE_COLOR}" stroke-width="1.5"/>`
    + `<circle cx="9" cy="9" r="1.16856" fill="${OUTLINE_COLOR}"/>${
      laserRays(`fill="${OUTLINE_COLOR}"`)}`;

const PEN_CURSOR = buildToolCursor(penLayer(HALO_COLOR, 3) + penLayer(OUTLINE_COLOR, 1.5), 3, 17);
const ERASER_CURSOR = buildToolCursor(eraserLayer(HALO_COLOR, 3) + eraserLayer(OUTLINE_COLOR, 1.5), 3, 16);
const LASER_CURSOR = buildToolCursor(laserInner, 10, 10);

export const WHITEBOARD_TOOL_CURSORS: Record<WhiteboardTool, string> = {
  [WhiteboardTool.None]: 'default',
  [WhiteboardTool.Pen]: PEN_CURSOR,
  [WhiteboardTool.Laser]: LASER_CURSOR,
  [WhiteboardTool.Shape]: 'crosshair',
  [WhiteboardTool.Arrow]: 'crosshair',
  [WhiteboardTool.EraserObject]: ERASER_CURSOR,
};

export const WHITEBOARD_COLOR_PALETTE = [
  '#006EFF',
  '#7B61FF',
  '#FFCC00',
  '#FF8800',
  '#FF4D4F',
  '#00C853',
  '#003DA5',
  '#000000',
  '#666666',
  '#CCCCCC',
  '#FFFFFF',
  'transparent',
] as const;

export const IconPen = IconBrush;
export const IconRect = IconRectangle;
export const IconEllipse = IconCircle;
export const IconUndo = IconRevoke;
export const IconClear = IconWhiteboardClear;
export const IconSave = IconWhiteboardSave;
export const IconCollapse = IconExit;
export const IconWhiteboard = BaseIconWhiteboard;

export {
  IconArrow,
  IconEraser,
  IconLaser,
  IconRedo,
  IconSelect,
};

export interface ShapeOption {
  type: 'rect' | 'ellipse';
  icon: Component;
  labelKey: string;
}

export const SHAPE_OPTIONS: ShapeOption[] = [
  { type: 'rect', icon: IconRect, labelKey: 'Whiteboard.ShapeRect' },
  { type: 'ellipse', icon: IconEllipse, labelKey: 'Whiteboard.ShapeEllipse' },
];

export interface ToolItem {
  tool: WhiteboardTool;
  icon: Component;
  labelKey: string;
  /** Shape tool opens a sub-selection popover (rect / ellipse). */
  hasShapeOptions?: boolean;
}

/**
 * Host-side drawing tools (phase 1, no guest interaction).
 * `Select` maps to WhiteboardTool.None (pointer / non-drawing mode).
 */
export const TOOL_ITEMS: ToolItem[] = [
  { tool: WhiteboardTool.None, icon: IconSelect, labelKey: 'Whiteboard.ToolSelect' },
  { tool: WhiteboardTool.Laser, icon: IconLaser, labelKey: 'Whiteboard.ToolLaser' },
  { tool: WhiteboardTool.Pen, icon: IconPen, labelKey: 'Whiteboard.ToolPen' },
  { tool: WhiteboardTool.Shape, icon: IconShape, labelKey: 'Whiteboard.ToolShape', hasShapeOptions: true },
  { tool: WhiteboardTool.EraserObject, icon: IconEraser, labelKey: 'Whiteboard.ToolEraser' },
  { tool: WhiteboardTool.Arrow, icon: IconArrow, labelKey: 'Whiteboard.ToolArrow' },
];
