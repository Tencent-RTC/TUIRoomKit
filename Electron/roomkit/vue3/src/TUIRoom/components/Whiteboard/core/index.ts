import { fabric } from 'fabric';
import {
  Canvas as ICanvas,
  Image as IImage,
  Object as IObject,
  ILineOptions,
  IImageOptions,
  IRectOptions,
  ICircleOptions,
  ITextOptions,
  IEllipseOptions,
  IEvent,
  ICanvasOptions,
  ITriangleOptions,
  Circle,
  Ellipse,
  Line,
} from 'fabric/fabric-impl';
import EventEmitter from './../emitter';
import Arrow from './arrow';
import initHotKeys from './initHotKeys';
import initControls from './initControls';
import initControlsRotate from './initControlsRotate';
import eventBus from '../../../hooks/useMitt';
import logger from '../../../utils/common/logger';

interface FabricEvents {
  'object:added': IEvent;
  'object:modified': IEvent;
  'object:removed': IEvent;
  'mouse:down': IEvent;
  'mouse:move': IEvent;
  'mouse:up': IEvent;
  'after:render': IEvent;
  'push-canvas-to-stack': IEvent;
  [key: string | symbol]: IEvent | any | undefined;
}

export type DrawingTool =
  | 'rectangle'
  | 'triangle'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'text'
  | 'pencil'
  | 'select'
  | 'eraser'
  | '';

interface ShapeOptions {
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  opacity?: number;
}

class FabricCanvas extends EventEmitter<FabricEvents> {
  private canvas: ICanvas;
  private currentShape: IObject | null = null;
  private drawingTool: DrawingTool = '';
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private endX = 0;
  private endY = 0;
  private options: ShapeOptions = {
    stroke: '#ff0000',
    strokeWidth: 5,
    fill: 'transparent',
    opacity: 1,
  };
  private images: string[] = [];
  private curImageIndex = 0;
  private isValidEraser = false;
  private isValidSelection = false;

  constructor(canvasId: string) {
    super();

    this.canvas = new fabric.Canvas(canvasId, {
      isDrawingMode: true,
      selection: false,
      includeDefaultValues: false,
      perPixelTargetFind: true,
    });
    this.setDrawingTool('pencil');
    // initHotKeys(this.canvas, this);
    initControls(this.canvas);
    initControlsRotate(this.canvas);
    this.initEvent();
  }

  public getCanvas(): ICanvas {
    return this.canvas;
  }

  public clearCanvas() {
    this.canvas.clear();
  }

  public setBackgroundColor(color: string): void {
    this.canvas.setBackgroundColor(color, () => {
      this.canvas.renderAll();
    });
  }

  public setBackgroundImage(imageUrl: string, options?: IImageOptions): void {
    fabric.Image.fromURL(imageUrl, (image: IImage) => {
      const canvasWidth = this.canvas.getWidth();
      const canvasHeight = this.canvas.getHeight();

      const scale = canvasHeight / (image.height as number);
      const imageWidth = (image.width as number) * scale;

      image.set({
        scaleX: scale,
        scaleY: scale,
        top: 0,
        left: (canvasWidth - imageWidth) / 2,
      });
      this.canvas.setBackgroundImage(
        image,
        () => {
          this.canvas.renderAll();
        },
        options
      );
    });
  }

  public addObject(object: IObject): void {
    this.canvas.add(object);
  }

  public removeObject(object: IObject): void {
    this.canvas.remove(object);
  }

  public removeAllObject() {
    this.canvas.getObjects().forEach(obj => {
      this.canvas.remove(obj);
    });
  }

  public getObjects(): IObject[] {
    return this.canvas.getObjects();
  }

  public getActiveObject(): IObject | undefined | null {
    return this.canvas.getActiveObject();
  }

  public setActiveObject(object: IObject): void {
    this.canvas.setActiveObject(object);
  }

  public setWidth(value: number | string): void {
    this.canvas.setWidth(value);
  }

  public setHeight(value: number | string): void {
    this.canvas.setHeight(value);
  }

  public exitTextEditing(): void {
    const activeObject = this.canvas.getActiveObject() as any;
    if (activeObject && activeObject.type === 'i-text') {
      activeObject.exitEditing();
    }
  }

  public reloadCanvas() {
    this.clearCanvas();
    this.canvas.renderAll();
    eventBus.emit('reload-canvas');
    this.setDrawingTool('pencil');
    this.currentShape = null;
  }

  public setDrawingTool(tool: DrawingTool) {
    if (this.drawingTool === tool) return;

    this.canvas.isDrawingMode = false;
    this.canvas.selection = false;
    this.canvas.perPixelTargetFind = true;
    this.drawingTool = tool;

    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();

    switch (tool) {
      case 'pencil':
        this.drawFreeDraw();
        break;
      case 'eraser':
        this.setEraser();
        break;
      case 'select':
        this.canvas.selection = true;
        this.canvas.perPixelTargetFind = false;
        this.canvas.defaultCursor = 'auto';
        break;
      case 'rectangle':
      case 'triangle':
      case 'circle':
      case 'ellipse':
      case 'line':
      case 'arrow':
        this.canvas.defaultCursor = 'crosshair';
        break;
      case 'text':
        this.canvas.defaultCursor = 'text';
        break;
      default:
        this.canvas.defaultCursor = 'crosshair';
        break;
    }
  }

  public setOptions(options: ShapeOptions) {
    this.options = { ...this.options, ...options };
  }

  public drawRect(options: IRectOptions): void {
    const rect = new fabric.Rect({ ...this.options, ...options });
    this.canvas.add(rect);
    this.currentShape = rect;
    this.canvas.defaultCursor = 'crosshair';
  }

  public drawTriangle(options: ITriangleOptions): void {
    const triangle = new fabric.Triangle({ ...this.options, ...options });
    this.canvas.add(triangle);
    this.currentShape = triangle;
    this.canvas.defaultCursor = 'crosshair';
  }

  public drawCircle(options: ICircleOptions): void {
    const circle = new fabric.Circle({ ...this.options, ...options });
    this.canvas.add(circle);
    this.currentShape = circle;
    this.canvas.defaultCursor = 'crosshair';
  }

  public drawEllipse(options: IEllipseOptions): void {
    const ellipse = new fabric.Ellipse({ ...this.options, ...options });
    this.canvas.add(ellipse);
    this.currentShape = ellipse;
    this.canvas.defaultCursor = 'crosshair';
  }

  public drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: ILineOptions
  ): void {
    const line = new fabric.Line([x1, y1, x2, y2], {
      ...this.options,
      ...options,
    });
    this.canvas.add(line);
    this.currentShape = line;
    this.canvas.defaultCursor = 'crosshair';
  }

  public drawArrow(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: ILineOptions
  ): void {
    const arrow = new Arrow([x1, y1, x2, y2], { ...this.options, ...options });
    this.canvas.add(arrow);
    this.currentShape = arrow;
    this.canvas.defaultCursor = 'crosshair';
  }

  public drawFreeDraw() {
    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.color = '#ff0000';
    this.canvas.freeDrawingBrush.width = 5;
    this.canvas.freeDrawingCursor = 'default';
    this.canvas.isDrawingMode = true;
    this.currentShape = null;
    this.canvas.on('path:created', (event: any) => {
      const { path } = event;
      if (path) {
        path.set({
          perPixelTargetFind: true,
        });
        this.canvas.renderAll();
      }
    });
  }

  public drawText(text: string, options?: ITextOptions): void {
    const textObj = new fabric.IText(text, {
      fontSize: 18,
      fill: '#ff0000',
      editingBorderColor: '#999999',
      cursorColor: '#999999',
      padding: 5,
      ...options,
    });
    this.canvas.add(textObj);
    this.canvas.defaultCursor = 'text';
    this.currentShape = textObj;
    textObj.enterEditing();
    textObj.hiddenTextarea.focus();
    textObj.on('editing:exited', () => {
      if (textObj.text.length > 0) {
        this.emit('push-canvas-to-stack', null);
      } else {
        this.canvas.remove(textObj);
      }
    });
    this.setActiveObject(textObj);
  }

  public insertImage(url: string, options?: IImageOptions): void {
    fabric.Image.fromURL(url, (img: IImage) => {
      if (options) {
        img.set(options);
      } else {
        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();
        const imageWidth = (img.width as number) * (img.scaleX as number);
        const imageHeight = (img.height as number) * (img.scaleY as number);
        const left = (canvasWidth - imageWidth) / 2;
        const top = (canvasHeight - imageHeight) / 2;
        img.set({ left, top });
      }
      this.canvas.add(img);
    });
  }

  public insertPPT(urls: string[]): void {
    this.images = urls;
    this.setCurrentScense(0);
    this.emit('insert:images', urls);
  }

  public setCurrentScense(index: number): void {
    this.curImageIndex = index;
    this.setBackgroundImage(this.images[this.curImageIndex]);
    this.emit('current:image', index);
  }

  public setEraser(options?: any): void {
    this.canvas.freeDrawingBrush = new fabric.EraserBrush(this.canvas, options);
    this.canvas.freeDrawingCursor = 'auto';
    this.canvas.renderAll();
  }

  private initEvent() {
    this.canvas.on('mouse:down', this.onMouseDown.bind(this));
    this.canvas.on('mouse:move', this.onMouseMove.bind(this));
    this.canvas.on('mouse:up', this.onMouseUp.bind(this));
    this.canvas.on('object:moving', this.onObjectMoving.bind(this));
    this.canvas.on('object:scaling', this.onObjectScaling.bind(this));
    eventBus.on('exitTextEditing', this.exitTextEditing.bind(this));
  }

  private onMouseDown(event: IEvent) {
    if (this.drawingTool === 'eraser') {
      this.isDrawing = true;
      const target = this.canvas.findTarget(event.e, false);
      if (target) {
        target.group?.removeWithUpdate(target) || this.canvas.remove(target);
        this.isValidEraser = true;
      }
      this.canvas.renderAll();
      return;
    }
    const activeObject = this.canvas.getActiveObject();
    if (!event.pointer || activeObject) return;

    this.isDrawing = true;
    const { x, y } = event.pointer;
    this.startX = x;
    this.startY = y;
    this.endX = this.startX;
    this.endY = this.startY;

    switch (this.drawingTool) {
      case 'rectangle':
        this.drawRect({
          left: x,
          top: y,
          width: 0,
          height: 0,
        });
        break;
      case 'triangle':
        this.drawTriangle({
          left: x,
          top: y,
          width: 0,
          height: 0,
        });
        break;
      case 'circle':
        this.drawCircle({
          left: x,
          top: y,
          radius: 0,
        });
        break;
      case 'ellipse':
        this.drawEllipse({
          left: x,
          top: y,
          rx: 0,
          ry: 0,
        });
        break;
      case 'line':
        this.drawLine(x, y, x, y);
        break;
      case 'arrow':
        this.drawArrow(x, y, x, y);
        break;
      case 'text':
        this.drawText('', { left: x, top: y });
        break;
      default:
        break;
    }
  }

  private onMouseMove(event: IEvent) {
    if (!event.pointer) {
      return;
    }
    const { x, y } = event.pointer;
    this.endX = x;
    this.endY = y;

    if (this.drawingTool === 'eraser' && this.isDrawing) {
      const target = this.canvas.findTarget(event.e, false);
      if (target) {
        target.group?.removeWithUpdate(target) || this.canvas.remove(target);
        this.isValidEraser = true;
      }
      this.canvas.renderAll();
    }

    if (!this.isDrawing || !this.currentShape) {
      return;
    }

    const width = Math.abs(x - this.startX);
    const height = Math.abs(y - this.startY);
    const left = Math.min(this.startX, x);
    const top = Math.min(this.startY, y);

    switch (this.drawingTool) {
      case 'rectangle':
        this.currentShape.set({
          left,
          top,
          width,
          height,
        });
        break;
      case 'triangle':
        this.currentShape.set({
          left,
          top,
          width,
          height,
        });
        break;
      case 'circle':
        {
          const radius = Math.sqrt(width * width + height * height) / 2;
          (this.currentShape as Circle).set({
            left,
            top,
            radius,
          });
        }
        break;
      case 'ellipse':
        (this.currentShape as Ellipse).set({
          left,
          top,
          rx: width / 2,
          ry: height / 2,
        });
        break;
      case 'line':
        (this.currentShape as Line).set({
          x2: x,
          y2: y,
        });
        break;
      case 'arrow':
        (this.currentShape as Arrow).set({
          x2: x,
          y2: y,
        });
        break;
      default:
        break;
    }
    this.currentShape.setCoords();
    this.canvas.renderAll();
  }

  private onMouseUp() {
    if (this.isNeedPushToStack()) {
      this.emit('push-canvas-to-stack', null);
    }
    this.isDrawing = false;
    this.currentShape = null;
    this.isValidEraser = false;
    this.isValidSelection = false;
  }

  private onObjectMoving(event: IEvent) {
    this.isValidSelection = true;
  }

  private onObjectScaling(event: IEvent) {
    this.isValidSelection = true;
  }

  private isNeedPushToStack() {
    if (
      this.drawingTool === 'text' ||
      (this.isValidEraser === false && this.drawingTool === 'eraser') ||
      (this.isValidSelection === false && this.drawingTool === 'select')
    ) {
      return false;
    }

    if (this.startX === this.endX && this.startY === this.endY) {
      if (this.currentShape !== null) {
        this.canvas.remove(this.currentShape);
        return false;
      }
    }

    return true;
  }

  public toDataURL(options?: ICanvasOptions) {
    return this.canvas.toDataURL(options);
  }

  public toJSON() {
    return this.canvas.toJSON();
  }

  public loadFromJSON(json: any, callback: any, reviver?: any): ICanvas {
    return this.canvas.loadFromJSON(json, callback, reviver);
  }

  public renderAll(): ICanvas {
    return this.canvas.renderAll();
  }

  public zoom(ratio = 1) {
    const point = new fabric.Point(
      (this.canvas.width as number) / 2,
      (this.canvas.height as number) / 2
    );
    this.canvas.zoomToPoint(point, ratio);
  }

  public getZoom(): number {
    return this.canvas.getZoom();
  }

  public zoomIn() {
    this.zoom(this.canvas.getZoom() * 1.1);
  }

  public zoomOut() {
    this.zoom(this.canvas.getZoom() / 1.1);
  }

  public destroy() {
    this.removeAllListeners();
    this.canvas.dispose();
  }
}

export default FabricCanvas;
