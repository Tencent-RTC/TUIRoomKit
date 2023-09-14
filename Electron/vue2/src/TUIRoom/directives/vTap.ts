import Vue from '../utils/vue';

class VueTouch {
  public dom: HTMLElement;
  public callback: Function;
  public isMove: boolean;

  constructor(el: HTMLElement, binding: any) {
    this.dom = el;
    this.callback = binding.value;

    this.isMove = false;

    el?.addEventListener('touchstart', () => {
      this.touchstart();
    }, { passive: true });

    el?.addEventListener('touchmove', () => {
      this.touchmove();
    }, { passive: true});

    el?.addEventListener('touchend', () => {
      this.touchend();
    }, { passive: true});
  }

  touchstart() {
    this.isMove = false;
  }

  touchmove() {
    this.isMove = true;
  }

  touchend() {
    if (!this.isMove) {
      this.callback();
    }
  }
}

Vue.directive('tap', {
  bind: function (el: HTMLElement, binding: any) {
    return new VueTouch(el, binding);
  }
});
