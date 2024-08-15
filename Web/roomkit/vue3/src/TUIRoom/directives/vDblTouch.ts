
const eventMap = new Map();

const TIME_OUT = 300;

class DblTouch {
  public dom: HTMLElement;
  public callback: Function;

  constructor(el: HTMLElement, binding: any) {
    this.dom = el;
    this.callback = binding.value;

    el?.addEventListener('touchend', (event: TouchEvent) => {
      if (binding.modifiers.stop) {
        event.stopPropagation();
      }
      this.touchend(event);
    });
  }

  touchend(event: TouchEvent) {
    const lastEvent = eventMap.get(this.dom);
    if (lastEvent) {
      this.callback && this.callback(event);
    } else {
      eventMap.set(this.dom, event);
      setTimeout(() => {
        eventMap.delete(this.dom);
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
