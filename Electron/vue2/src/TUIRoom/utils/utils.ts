export function debounce(fn: { apply: (arg0: any, arg1: any) => void; }, delay: number | undefined) {
  let timer: number;
  return function (this:any, ...args: any) {
    if (timer > 0) {
      clearTimeout(timer);
    }
    timer = window?.setTimeout(() => {
      fn.apply(this, args);
      timer = -1;
    }, delay);
  };
}

export function throttle(fn: { apply: (arg0: any, arg1: any[]) => void; }, delay: number) {
  let previousTime = 0;
  return function (this:any, ...args: any[]) {
    // eslint-disable-next-line prefer-rest-params
    const now  = Date.now();
    if (now - previousTime > delay) {
      fn.apply(this, args);
      previousTime = now;
    }
  };
};

export function setFullScreen(element: HTMLElement) {
  const fullScreenElement = element as HTMLElement & {
    mozRequestFullScreen(): Promise<void>;
    msRequestFullscreen(): Promise<void>;
    webkitRequestFullScreen(): Promise<void>;
  };
  if (fullScreenElement?.requestFullscreen) {
    fullScreenElement?.requestFullscreen();
  } else if (fullScreenElement?.mozRequestFullScreen) {
    fullScreenElement?.mozRequestFullScreen();
  } else if (fullScreenElement?.webkitRequestFullScreen) {
    fullScreenElement?.webkitRequestFullScreen();
  } else if (fullScreenElement?.msRequestFullscreen) {
    fullScreenElement?.msRequestFullscreen();
  }
}

export function exitFullScreen() {
  if (!document?.fullscreenElement
    && !(document as any)?.webkitFullscreenElement && !(document as any)?.mozFullScreenElement) {
    return;
  }
  const exitFullScreenDocument  = document as Document & {
    mozCancelFullScreen(): Promise<void>;
    msExitFullscreen(): Promise<void>;
    webkitExitFullscreen(): Promise<void>;
  };
  if (exitFullScreenDocument?.exitFullscreen) {
    exitFullScreenDocument?.exitFullscreen();
  } else if (exitFullScreenDocument?.msExitFullscreen) {
    exitFullScreenDocument?.msExitFullscreen();
  } else if (exitFullScreenDocument?.mozCancelFullScreen) {
    exitFullScreenDocument?.mozCancelFullScreen();
  } else if (exitFullScreenDocument?.webkitExitFullscreen) {
    exitFullScreenDocument?.webkitExitFullscreen();
  }
}


export function getUrlParam(key: string) {
  const url = window?.location.href.replace(/^[^?]*\?/, '');
  const regexp = new RegExp(`(^|&)${key}=([^&#]*)(&|$|)`, 'i');
  const paramMatch = url?.match(regexp);

  return paramMatch ? paramMatch[2] : null;
}


export function deepClone(data: any) {
  let res: any = null;
  const reference = [Date, RegExp, Set, WeakSet, Map, WeakMap, Error];
  if (reference.includes(data?.constructor)) {
    res = new data.constructor(data);
  } else if (Array.isArray(data)) {
    res = [];
    data.forEach((e, i) => {
      res[i] = deepClone(e);
    });
  } else if (typeof data === 'object' && data !== null) {
    res = {};
    Object.keys(data).forEach((key) => {
      if (Object.hasOwnProperty.call(data, key)) {
        res[key] = deepClone(data[key]);
      }
    });
  } else {
    res = data;
  }
  return res;
}

export { clipBoard } from './adapter';

export const isUndefined = (value: any) => typeof value === 'undefined';
export const isString = (value: any) => typeof value === 'string';
export const isNumber = (value: any) => typeof value === 'number';
export const isStringNumber = (value: any) => typeof value === 'string' && !isNaN(Number(value));
export const isFunction = (value: any) => typeof value === 'function';

export function addSuffix(value: string | number, suffix = 'px') {
  if (isNumber(value) || isStringNumber(value)) {
    return value + suffix;
  }
  return value;
}
