export enum DrawingTool {
  Pointer = 'Pointer',
  Laser = 'Laser',
  Rectangle = 'Rectangle',
  Triangle = 'Triangle',
  Circle = 'Circle',
  Ellipse = 'Ellipse',
  Line = 'Line',
  Arrow = 'Arrow',
  Text = 'Text',
  Pencil = 'Pencil',
  Select = 'Select',
  Eraser = 'Eraser',
  Image = 'Image',
  Clear = 'Clear',
  Redo = 'Redo',
  Undo = 'Undo',
  Download = 'Download',
  Retract = 'Retract',
  None = 'null',
}

export interface ShapeOptions {
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  opacity?: number;
  lineDash?: number[];
}

export interface ToolSettings {
  drawingTool: DrawingTool;
  shapeOptions?: ShapeOptions;
}

export const toolCursorStyleMap = {
  [DrawingTool.Laser]: 'laser-cursor',
  [DrawingTool.Eraser]: 'eraser-cursor',
  [DrawingTool.Pointer]: null,
  [DrawingTool.Rectangle]: null,
  [DrawingTool.Triangle]: null,
  [DrawingTool.Circle]: null,
  [DrawingTool.Ellipse]: null,
  [DrawingTool.Line]: null,
  [DrawingTool.Arrow]: null,
  [DrawingTool.Text]: null,
  [DrawingTool.Pencil]: null,
  [DrawingTool.Select]: null,
  [DrawingTool.Download]: null,
  [DrawingTool.Clear]: null,
  [DrawingTool.Redo]: null,
  [DrawingTool.Undo]: null,
};
