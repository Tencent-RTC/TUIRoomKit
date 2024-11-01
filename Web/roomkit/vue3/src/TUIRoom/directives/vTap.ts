const eventMap = new Map();

const TIME_OUT = 300;

class VueTouch {
  public dom: HTMLElement;
  public callback: (event: TouchEvent) => void;
  public isMove: boolean;
  public isInOnceTouch: boolean;
  public isLazyTap: boolean;

  constructor(el: HTMLElement, binding: any) {
    this.dom = el;
    this.callback = binding.value;
    this.isLazyTap = binding.modifiers.lazy;

    this.isMove = false;
    this.isInOnceTouch = false;

    el?.addEventListener('touchstart', (event: TouchEvent) => {
      if (binding.modifiers.stop) {
        event.stopPropagation();
      }
      this.touchstart(event);
    });

    el?.addEventListener('touchmove', (event: TouchEvent) => {
      if (binding.modifiers.stop) {
        event.stopPropagation();
      }
      this.touchmove();
    });

    el?.addEventListener('touchend', (event: TouchEvent) => {
      if (binding.modifiers.stop) {
        event.stopPropagation();
      }
      this.touchend(event);
    });
  }

  touchstart(event: TouchEvent) {
    if (event.touches.length > 1 || this.isInOnceTouch) {
      return;
    }
    this.isMove = false;
    this.isInOnceTouch = true;
  }

  touchmove() {
    if (!this.isInOnceTouch) {
      return;
    }
    this.isMove = true;
    this.isInOnceTouch = false;
  }

  touchend(event: TouchEvent) {
    if (this.isMove || !this.isInOnceTouch) {
      return;
    }
    this.isInOnceTouch = false;
    if (this.isLazyTap) {
      if (eventMap.get(this.dom)) {
        clearTimeout(eventMap.get(this.dom));
        eventMap.delete(this.dom);
        return;
      }
      const timer = setTimeout(() => {
        this.callback(event);
        eventMap.delete(this.dom);
      }, TIME_OUT);
      eventMap.set(this.dom, timer);
    } else {
      this.callback(event);
    }
  }
}

const vTap = {
  mounted(el: HTMLElement, binding: any) {
    return new VueTouch(el, binding);
  },
};

export default vTap;
