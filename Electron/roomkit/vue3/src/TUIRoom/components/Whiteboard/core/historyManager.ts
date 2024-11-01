import { inject } from 'vue';
import { ipcRenderer } from 'electron';
import FabricCanvas from './index';
import eventBus from '../../../hooks/useMitt';
import EventEmitter from './../emitter';
import { IEvent } from 'fabric/fabric-impl';

interface HistoryManagerEvent {
  'change-step': IEvent;
  'change-history': IEvent;
  [key: string | symbol]: IEvent | any | undefined;
}

class HistoryManager extends EventEmitter<HistoryManagerEvent> {
  private canvas: FabricCanvas | null = inject('canvas')!;
  private step = 0;
  private historyList: any[] = [];

  constructor(canvas: FabricCanvas) {
    super();
    this.canvas = canvas;
    this.initEvent();
    this.setupIpcListeners();
  }

  private renderCanvas(data: any): void {
    if (!this.canvas) return;
    this.canvas.loadFromJSON(data, () => {
      this.canvas?.renderAll();
    });
  }

  public undo(): void {
    eventBus.emit('exitTextEditing');
    if (!this.canvas || this.step === 0) return;

    this.step = this.step - 1;
    this.emit('change-step', this.step);
    this.step === 0
      ? this.canvas.clearCanvas()
      : this.renderCanvas(this.historyList[this.step - 1]);
  }

  public redo(): void {
    if (!this.canvas || this.step >= this.historyList.length) return;

    const canvasState = this.historyList[this.step];
    this.step = this.step + 1;
    this.emit('change-step', this.step);
    this.renderCanvas(canvasState);
  }

  private addToUndoStack(): void {
    if (!this.canvas) return;

    const data = this.canvas.toJSON();
    if (this.historyList.length !== this.step) {
      this.historyList = this.historyList.slice(0, this.step);
    }
    this.historyList.push(data);
    this.emit('change-history', this.historyList.length);
    this.step = this.historyList.length;
    this.emit('change-step', this.step);
  }

  public clearHistoryList(): void {
    this.historyList = [];
    this.step = 0;
  }

  public isCanvasEmpty() {
    return this.canvas?.getObjects().length === 0;
  }

  public clear(): void {
    if (this.isCanvasEmpty() === true) {
      return;
    }
    this.canvas?.clearCanvas();
    if (this.historyList.length > 0) {
      this.addToUndoStack();
    }
  }

  private initEvent(): void {
    if (this.canvas) {
      this.canvas.on('push-canvas-to-stack', this.addToUndoUpdate.bind(this));
    }
  }

  private setupIpcListeners(): void {
    ipcRenderer.on(
      'whiteboard:clear',
      (this.clearHistoryList = this.clearHistoryList.bind(this))
    );
    ipcRenderer.on(
      'annotation:clear',
      (this.clearHistoryList = this.clearHistoryList.bind(this))
    );
  }

  private addToUndoUpdate(): void {
    this.addToUndoStack();
  }

  public destroy(): void {
    if (this.canvas) {
      this.canvas.off('push-canvas-to-stack', this.addToUndoUpdate);
    }
    ipcRenderer.removeAllListeners('whiteboard:clear');
    ipcRenderer.removeAllListeners('annotation:clear');
  }
}

export default HistoryManager;
