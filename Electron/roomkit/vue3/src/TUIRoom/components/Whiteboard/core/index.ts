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
// import initHotKeys from './initHotKeys';
import initControls from './initControls';
import initControlsRotate from './initControlsRotate';
import eventBus from '../../../hooks/useMitt';
import { DrawingTool, ShapeOptions, ToolSettings } from './../type';
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

class FabricCanvas extends EventEmitter<FabricEvents> {
  private canvas: ICanvas;
  private currentShape: IObject | null = null;
  private drawingTool: DrawingTool = DrawingTool.None;
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private endX = 0;
  private endY = 0;
  private options: ShapeOptions = {
    strokeWidth: 5,
    stroke: '#22262E',
    fill: 'transparent',
    lineDash: [],
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
    this.setDrawingTool(DrawingTool.Pencil);
    // initHotKeys(this.canvas, this);
    initControls(this.canvas);
    initControlsRotate(this.canvas);
    this.initEvent();
  }

  public getCanvas(): ICanvas {
    return this.canvas;
  }

  public renderCanvas(data: any) {
    this.loadFromJSON(data, () => {
      this.renderAll();
    });
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

  public resetActiveObject(): void {
    const allObjects = this.canvas.getObjects();
    const activeSelection = new fabric.ActiveSelection(allObjects, {
      canvas: this.canvas,
    });
    this.canvas.setActiveObject(activeSelection);
    this.canvas.discardActiveObject();
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

  public setObjectsSelectable(objectsSelectable: boolean) {
    this.canvas.getObjects().forEach((obj: any) => {
      obj.selectable = objectsSelectable;
      obj.evented = objectsSelectable;
    });
    this.canvas.perPixelTargetFind = !objectsSelectable;
    this.canvas.selection = objectsSelectable;

    if (!objectsSelectable) {
      this.canvas.renderAll();
    }
  }

  public setEvented() {
    this.canvas.getObjects().forEach((obj: any) => {
      obj.evented = true;
    });
    this.canvas.renderAll();
  }

  public clearCanvas() {
    this.canvas.clear();
  }

  public reloadCanvas() {
    this.clearCanvas();
    this.canvas.renderAll();
    eventBus.emit('reload-canvas');
    this.setDrawingTool(DrawingTool.Pencil);
    this.currentShape = null;
  }

  public setDrawingTool(tool: DrawingTool) {
    if (this.drawingTool === tool) return;
    this.canvas.isDrawingMode = false;
    this.drawingTool = tool;
    this.canvas.discardActiveObject();
    this.setObjectsSelectable(false);

    switch (tool) {
      case DrawingTool.Pencil:
        this.drawFreeDraw();
        break;
      case DrawingTool.Eraser:
        this.setEvented();
        this.setEraser();
        break;
      case DrawingTool.Select:
        this.setObjectsSelectable(true);
        this.resetActiveObject();
        this.canvas.defaultCursor = 'move';
        break;
      case DrawingTool.Arrow:
        this.canvas.defaultCursor = 'crosshair';
        break;
      case DrawingTool.Text:
        this.canvas.defaultCursor = 'text';
        break;
      default:
        this.canvas.defaultCursor = 'crosshair';
        break;
    }
  }

  public setOptions(toolSetting: ToolSettings) {
    this.options = toolSetting.shapeOptions!;
    this.setPencilBrushOptions();
  }

  public setTextOptions(): ITextOptions {
    const options = {
      fontSize: this.options.strokeWidth,
      fill: this.options.stroke,
      padding: 5,
      selectable: false,
      evented: false,
    };
    return options;
  }

  public setPencilBrushOptions(): void {
    this.canvas.freeDrawingBrush.color = this.options.stroke;
    this.canvas.freeDrawingBrush.width = this.options.strokeWidth;
  }

  public discardActiveObject() {
    this.canvas.discardActiveObject();
  }

  public drawRect(options: IRectOptions): void {
    const rect = new fabric.Rect({
      ...this.options,
      selectable: false,
      evented: false,
      strokeUniform: true,
      noScaleCache: false,
      strokeDashArray: this.options.lineDash,
      ...options,
    });
    this.canvas.add(rect);
    this.currentShape = rect;
    this.canvas.defaultCursor = 'crosshair';
  }

  public drawTriangle(options: ITriangleOptions): void {
    const triangle = new fabric.Triangle({
      ...this.options,
      selectable: false,
      evented: false,
      strokeUniform: true,
      noScaleCache: false,
      strokeDashArray: this.options.lineDash,
      ...options,
    });
    this.canvas.add(triangle);
    this.currentShape = triangle;
    this.canvas.defaultCursor = 'crosshair';
  }

  public drawCircle(options: ICircleOptions): void {
    const circle = new fabric.Circle({
      ...this.options,
      selectable: false,
      evented: false,
      strokeUniform: true,
      noScaleCache: false,
      strokeDashArray: this.options.lineDash,
      ...options,
    });
    this.canvas.add(circle);
    this.currentShape = circle;
    this.canvas.defaultCursor = 'crosshair';
  }

  public drawEllipse(options: IEllipseOptions): void {
    const ellipse = new fabric.Ellipse({
      ...this.options,
      selectable: false,
      evented: false,
      strokeUniform: true,
      noScaleCache: false,
      strokeDashArray: this.options.lineDash,
      ...options,
    });
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
      selectable: false,
      strokeDashArray: this.options.lineDash,
      evented: false,
      strokeUniform: true,
      noScaleCache: false,
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
    const customOptions = {
      ...options,
      arrowWidth: options?.arrowWidth ?? this.options.strokeWidth,
      arrowHeight: options?.arrowHeight ?? this.options.strokeWidth,
    };
    const arrow = new Arrow([x1, y1, x2, y2], {
      ...this.options,
      ...customOptions,
      selectable: false,
      evented: false,
      strokeUniform: true,
      noScaleCache: false,
    });
    this.canvas.add(arrow);
    this.currentShape = arrow;
    this.canvas.defaultCursor = 'crosshair';
  }

  public drawFreeDraw() {
    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.color = this.options.stroke;
    this.canvas.freeDrawingBrush.width = this.options.strokeWidth;
    this.canvas.freeDrawingCursor = 'default';
    this.canvas.isDrawingMode = true;
    this.currentShape = null;
    this.canvas.on('path:created', (event: any) => {
      const { path } = event;
      if (path) {
        path.set({
          perPixelTargetFind: true,
          objectCaching: false,
          statefullCache: true,
          strokeUniform: true,
          noScaleCache: false,
          subdivisionScale: 100,
        });
        this.canvas.renderAll();
      }
    });
  }

  public drawText(text: string, options?: ITextOptions): void {
    const textObj = new fabric.IText(text, {
      fontSize: this.options.strokeWidth,
      fill: this.options.stroke,
      padding: 5,
      selectable: false,
      evented: false,
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
        const aspectRatio = imageWidth / imageHeight;
        const halfCanvasWidth = canvasWidth / 2;
        const halfCanvasHeight = canvasHeight / 2;
        let scaledWidth;
        let scaledHeight;
        if (aspectRatio > 1) {
          scaledWidth = halfCanvasWidth;
          scaledHeight = scaledWidth / aspectRatio;
        } else {
          scaledHeight = halfCanvasHeight;
          scaledWidth = scaledHeight * aspectRatio;
        }
        const scale = scaledWidth / imageWidth;
        img.scale(scale);
        const left = (canvasWidth - scaledWidth) / 2;
        const top = (canvasHeight - scaledHeight) / 2;
        img.set({ left, top });
      }
      this.canvas.add(img);
      this.setDrawingTool(DrawingTool.Select);
      this.setActiveObject(img);
      this.emit('push-canvas-to-stack', null);
      this.canvas.requestRenderAll();
      this.emit('insert-images', null);
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

  public setEraser(): void {
    this.canvas.renderAll();
  }

  private initEvent() {
    this.canvas.on('mouse:down', this.onMouseDown.bind(this));
    this.canvas.on('mouse:move', this.onMouseMove.bind(this));
    this.canvas.on('mouse:up', this.onMouseUp.bind(this));
    this.canvas.on('object:moving', this.onObjectMoving.bind(this));
    this.canvas.on('object:scaling', this.onObjectScaling.bind(this));
    this.canvas.on('object:rotating', this.onObjectRotating.bind(this));
    eventBus.on('exitTextEditing', this.exitTextEditing.bind(this));
  }

  private onMouseDown(event: IEvent) {
    if (this.drawingTool === DrawingTool.Eraser) {
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
      case DrawingTool.Pencil:
        this.setPencilBrushOptions();
        break;
      case DrawingTool.Rectangle:
        this.drawRect({
          left: x,
          top: y,
          width: 0,
          height: 0,
        });
        break;
      case DrawingTool.Triangle:
        this.drawTriangle({
          left: x,
          top: y,
          width: 0,
          height: 0,
        });
        break;
      case DrawingTool.Circle:
        this.drawCircle({
          left: x,
          top: y,
          radius: 0,
        });
        break;
      case DrawingTool.Ellipse:
        this.drawEllipse({
          left: x,
          top: y,
          rx: 0,
          ry: 0,
        });
        break;
      case DrawingTool.Line:
        this.drawLine(x, y, x, y);
        break;
      case DrawingTool.Arrow:
        this.drawArrow(x, y, x, y, {
          arrowWidth: this.options.strokeWidth,
          arrowHeight: this.options.strokeWidth,
        });
        break;
      case DrawingTool.Text:
        this.drawText('', { options: this.setTextOptions(), left: x, top: y });
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

    if (this.drawingTool === DrawingTool.Eraser && this.isDrawing) {
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
      case DrawingTool.Rectangle:
        this.currentShape.set({
          left,
          top,
          width,
          height,
        });
        break;
      case DrawingTool.Triangle:
        this.currentShape.set({
          left,
          top,
          width,
          height,
        });
        break;
      case DrawingTool.Circle:
        {
          const radius = Math.sqrt(width * width + height * height) / 2;
          (this.currentShape as Circle).set({
            left,
            top,
            radius,
          });
        }
        break;
      case DrawingTool.Ellipse:
        (this.currentShape as Ellipse).set({
          left,
          top,
          rx: width / 2,
          ry: height / 2,
        });
        break;
      case DrawingTool.Line:
        (this.currentShape as Line).set({
          x2: x,
          y2: y,
        });
        break;
      case DrawingTool.Arrow:
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
    this.canvas.renderAll();
    this.isValidSelection = true;
  }

  private onObjectScaling(event: IEvent) {
    this.canvas.renderAll();
    this.isValidSelection = true;
  }

  private onObjectRotating(event: IEvent) {
    this.canvas.renderAll();
    this.isValidSelection = true;
  }
  private isNeedPushToStack() {
    if (
      this.drawingTool === DrawingTool.Text ||
      (this.isValidEraser === false &&
        this.drawingTool === DrawingTool.Eraser) ||
      (this.isValidSelection === false &&
        this.drawingTool === DrawingTool.Pointer) ||
      (this.isValidSelection === false &&
        this.drawingTool === DrawingTool.Laser)
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

  public requestRenderAll() {
    return this.canvas.requestRenderAll();
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
