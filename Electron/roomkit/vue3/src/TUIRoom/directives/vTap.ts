
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
    });

    el?.addEventListener('touchmove', () => {
      this.touchmove();
    });

    el?.addEventListener('touchend', (event: TouchEvent) => {
      this.touchend(event);
    });
  }

  touchstart() {
    this.isMove = false;
  }

  touchmove() {
    this.isMove = true;
  }

  touchend(event?: TouchEvent) {
    if (!this.isMove) {
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
