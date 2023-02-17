const { requestAnimationFrame, cancelAnimationFrame } =  window;
const canvasWidth = 1280;
const canvasHeight = 720;

/*
@des 将video内容绘制到canvas上面
@example
const video = document.getElementById('video');
const canvas = new ToCanvas(video);
// 获取 canvas element 元素
const canvasElement = canvas.element;
// 在用户交互事件的回调中执行play方法
canvas.play();
window.setTimeout(() => {
  canvas.stop();
}, 2000);
*/
type CanvasImageSource = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

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

// 控制requestAnimationFrame的频率
function setAnimationFrame(render: Function, stepTime = 24) {
  // 记录每次动画执行结束的时间
  let lastTime = Date.now();
  // 计时器ID
  let currentTime;
  const timer = {
    id: -1,
  };
  function animeLoop() {
    // 记录当前时间
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


// 清除AnimationFrame
function clearAnimationFrame(timer: any) {
  cancelAnimationFrame(timer.id);
}
