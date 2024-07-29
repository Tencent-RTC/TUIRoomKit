import Vue from '../utils/vue';

const eventMap = new Map();

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

  private getTouchPosition(event: TouchEvent) {
    const touchInfo = event.touches[0] || event.changedTouches[0] || event.targetTouches[0];
    return {
      x: touchInfo.pageX,
      y: touchInfo.pageY,
    };
  }

  touchend(event: TouchEvent) {
    const lastEvent = eventMap.get(this.dom);
    if (lastEvent) {
      const { x: lastPositionX, y: lastPositionY }  = this.getTouchPosition(lastEvent);
      const { x: currentPositionX, y: currentPositionY }  = this.getTouchPosition(event);
      if (Math.abs(lastPositionX - currentPositionX) < 10 || Math.abs(lastPositionY - currentPositionY) < 10) {
        this.callback && this.callback(event);
      }
    } else {
      eventMap.set(this.dom, event);
      setTimeout(() => {
        eventMap.delete(this.dom);
      }, 200);
    }
  }
}


Vue.directive('dblTouch', {
  bind(el: HTMLElement, binding: any) {
    return new DblTouch(el, binding);
  },
});
