const { requestAnimationFrame, cancelAnimationFrame } = window;
const canvasWidth = 1280;
const canvasHeight = 720;

type CanvasImageSource =
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement;

export default class ToCanvas {
  private sourceElement!: CanvasImageSource;

  private timer: any;

  public element!: HTMLCanvasElement;

  private ctx: any;

  constructor(Element: CanvasImageSource) {
    if (!Element) {
      return;
    }
    this.sourceElement = Element;
    this.timer = null;
    this.element = this.initCanvas();
    this.ctx = this.element.getContext('2d');
  }

  initCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    return canvas;
  }

  drawFrame() {
    this.ctx.drawImage(this.sourceElement, 0, 0, canvasWidth, canvasHeight);
    this.element.style.objectFit = this.sourceElement.style.objectFit;
    this.element.style.transform = this.sourceElement.style.transform;
  }

  play() {
    this.timer = setAnimationFrame(this.drawFrame.bind(this));
  }

  stop() {
    clearAnimationFrame(this.timer);
  }
}

function setAnimationFrame(render: Function, stepTime = 24) {
  let lastTime = Date.now();
  let currentTime;
  const timer = {
    id: -1,
  };
  function animeLoop() {
    currentTime = Date.now();
    if (currentTime - lastTime > stepTime) {
      lastTime = currentTime;
      render();
    }
    timer.id = requestAnimationFrame(animeLoop);
  }
  animeLoop();
  return timer;
}

function clearAnimationFrame(timer: any) {
  cancelAnimationFrame(timer.id);
}
