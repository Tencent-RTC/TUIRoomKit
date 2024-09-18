const touchEventMap = new Map();
const clickEventMap = new Map();

const TIME_OUT = 300;

class DblTouch {
  public dom: HTMLElement;
  public callback: (event?: Event | TouchEvent) => void;

  constructor(el: HTMLElement, binding: any) {
    this.dom = el;
    this.callback = binding.value;

    // Compatible iphone 11 chrome browser tap twice trigger once touchend and twice click event problem
    el?.addEventListener('click', (event: Event) => {
      if (binding.modifiers.stop) {
        event.stopPropagation();
      }
      this.click(event);
    });

    el?.addEventListener('touchend', (event: TouchEvent) => {
      if (binding.modifiers.stop) {
        event.stopPropagation();
      }
      this.touchend(event);
    });
  }

  executeCallback(event: Event | TouchEvent) {
    clickEventMap.delete(this.dom);
    touchEventMap.delete(this.dom);
    this.callback && this.callback(event);
  }

  click(event: Event) {
    const lastEvent = clickEventMap.get(this.dom);
    if (lastEvent) {
      this.executeCallback(event);
    } else {
      clickEventMap.set(this.dom, event);
      setTimeout(() => {
        clickEventMap.delete(this.dom);
      }, TIME_OUT);
    }
  }

  touchend(event: TouchEvent) {
    const lastEvent = touchEventMap.get(this.dom);
    if (lastEvent) {
      this.executeCallback(event);
    } else {
      touchEventMap.set(this.dom, event);
      setTimeout(() => {
        touchEventMap.delete(this.dom);
      }, TIME_OUT);
    }
  }
}

const vDblTouch = {
  mounted(el: HTMLElement, binding: any) {
    return new DblTouch(el, binding);
  },
};

export default vDblTouch;
