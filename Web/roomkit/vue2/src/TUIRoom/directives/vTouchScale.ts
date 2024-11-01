/**
 * <div v-touch-scale="enable"></div>
 */
import Vue from '../utils/vue';

const touchScaleElementMap = new Map<HTMLElement, TouchScale>();

class TouchScale {
  public touchDom: HTMLElement;
  public transformDom: HTMLElement;

  public lastPosition = { x: 0, y: 0 };
  public lastCenterPosition = { x: 0, y: 0 };
  public lastDistance = 0;

  public currentTranslate = { x: 0, y: 0 };
  public currentCenterPosition = { x: 0, y: 0 };
  public currentScale = 1;

  public tempScale = 1;
  public tempTranslate = { x: 0, y: 0 };

  public isOneFingerControl = false;
  public isTwoFingerControl = false;

  public isEnabled = false;

  constructor(el: HTMLElement, binding: any) {
    this.touchDom = el;
    this.transformDom = el;
    this.transformDom.style.transformOrigin = '0 0';

    this.isEnabled = !!binding.value;

    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.touchDom?.addEventListener('touchstart', this.handleTouchStart, false);
    this.touchDom?.addEventListener('touchmove', this.handleTouchMove, false);
    this.touchDom?.addEventListener('touchend', this.handleTouchEnd, false);
  }

  public updateBinding(binding: any) {
    this.isEnabled = !!binding.value;
  }

  public destroy() {
    this.touchDom?.removeEventListener(
      'touchstart',
      this.handleTouchStart,
      false
    );
    this.touchDom?.removeEventListener(
      'touchmove',
      this.handleTouchMove,
      false
    );
    this.touchDom?.removeEventListener('touchend', this.handleTouchEnd, false);
  }

  private handleTouchStart(event: TouchEvent) {
    if (!this.isEnabled) {
      return;
    }
    event.preventDefault();
    if (this.currentScale !== 1) {
      event.stopPropagation();
    }
    if (event.touches.length === 2) {
      this.handleScaleStart(event);
      this.isTwoFingerControl = true;
    }
    if (event.touches.length === 1) {
      this.handlePositionStart(event);
      this.isOneFingerControl = true;
    }
  }

  private handleTouchMove(event: TouchEvent) {
    if (!this.isEnabled) {
      return;
    }
    event.preventDefault();
    if (this.tempScale !== 1) {
      event.stopPropagation();
    }
    if (event.touches.length === 2 && this.isTwoFingerControl) {
      this.handleScaleMove(event);
    }
    if (event.touches.length === 1 && this.isOneFingerControl) {
      this.handlePositionMove(event);
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    if (!this.isEnabled) {
      return;
    }
    event.preventDefault();
    if (this.currentScale !== 1) {
      event.stopPropagation();
    }
    if (this.isTwoFingerControl) {
      this.handleScaleEnd();
    }
    this.isTwoFingerControl = false;
    this.isOneFingerControl = false;
  }

  private getDistance(touchTargetA: Touch, touchTargetB: Touch) {
    return Math.sqrt(
      Math.pow(touchTargetA.pageX - touchTargetB.pageX, 2) +
        Math.pow(touchTargetA.pageY - touchTargetB.pageY, 2)
    );
  }

  private getCenterPointer(touchTargetA: Touch, touchTargetB: Touch) {
    return {
      x: (touchTargetA.pageX + touchTargetB.pageX) / 2,
      y: (touchTargetA.pageY + touchTargetB.pageY) / 2,
    };
  }

  private getTranslateLimitedObj(
    translateObj: { x: number; y: number },
    scale: number
  ) {
    const translateResult = { ...translateObj };
    if (translateObj.x > 0) {
      translateResult.x = 0;
    }
    if (translateObj.x < 0 - (scale - 1) * this.transformDom.offsetWidth) {
      translateResult.x = 0 - (scale - 1) * this.transformDom.offsetWidth;
    }
    if (translateObj.y > 0) {
      translateResult.y = 0;
    }
    if (translateObj.y < 0 - (scale - 1) * this.transformDom.offsetHeight) {
      translateResult.y = 0 - (scale - 1) * this.transformDom.offsetHeight;
    }
    return translateResult;
  }

  private handleScaleStart(event: TouchEvent) {
    const [initATarget, initBTarget] = event.touches;
    this.lastDistance = this.getDistance(initATarget, initBTarget);
    this.lastCenterPosition = this.getCenterPointer(initATarget, initBTarget);
  }

  private handleScaleMove(event: TouchEvent) {
    const [moveATarget, moveBTarget] = event.touches;
    const moveDistance = this.getDistance(moveATarget, moveBTarget);
    const centerPosition = this.getCenterPointer(moveATarget, moveBTarget);

    this.tempScale = this.currentScale * (moveDistance / this.lastDistance);
    if (this.tempScale <= 1) {
      this.tempTranslate = { x: 0, y: 0 };
      this.tempScale = 1;
    } else {
      const gapTop =
        (moveDistance / this.lastDistance) *
          (this.currentScale * this.lastCenterPosition.y) -
        this.currentScale * centerPosition.y;
      const gapLeft =
        (moveDistance / this.lastDistance) *
          (this.currentScale * this.lastCenterPosition.x) -
        this.currentScale * centerPosition.x;
      this.tempTranslate = {
        x: this.currentTranslate.x - gapLeft,
        y: this.currentTranslate.y - gapTop,
      };
      this.tempTranslate = this.getTranslateLimitedObj(
        this.tempTranslate,
        this.tempScale
      );
    }
    this.transformDom.style.transform = `translate(${this.tempTranslate.x}px, ${this.tempTranslate.y}px) scale(${this.tempScale})`;
  }

  private handleScaleEnd() {
    this.currentScale = this.tempScale;
    this.currentTranslate = this.tempTranslate;
  }

  private handlePositionStart(event: TouchEvent) {
    this.lastPosition = {
      x: event.touches[0].pageX,
      y: event.touches[0].pageY,
    };
  }

  private handlePositionMove(event: TouchEvent) {
    const currentPosition = {
      x: event.touches[0].pageX,
      y: event.touches[0].pageY,
    };
    this.currentTranslate = {
      x: this.currentTranslate.x + (currentPosition.x - this.lastPosition.x),
      y: this.currentTranslate.y + (currentPosition.y - this.lastPosition.y),
    };
    this.currentTranslate = this.getTranslateLimitedObj(
      this.currentTranslate,
      this.currentScale
    );
    this.lastPosition = currentPosition;
    this.transformDom.style.transform = `translate(${this.currentTranslate.x}px, ${this.currentTranslate.y}px) scale(${this.currentScale})`;
  }
}

Vue.directive('touchScale', {
  bind(el: HTMLElement, binding: any) {
    if (binding.value) {
      const newTouchScale = new TouchScale(el, binding);
      touchScaleElementMap.set(el, newTouchScale);
    }
  },
  update(el: HTMLElement, binding: any) {
    if (touchScaleElementMap.get(el)) {
      touchScaleElementMap.get(el)?.updateBinding(binding);
    } else if (binding.value) {
      const newTouchScale = new TouchScale(el, binding);
      touchScaleElementMap.set(el, newTouchScale);
    }
  },
  unbind(el: HTMLElement) {
    touchScaleElementMap.get(el)?.destroy();
    touchScaleElementMap.delete(el);
  },
});
