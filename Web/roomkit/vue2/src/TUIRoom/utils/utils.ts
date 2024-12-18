import { isWeChat } from './environment';
/**
 * debounce function
 * @param {*} fn Functions to execute
 * @param {*} delay Interval time
 * @returns function
 */
export function debounce(
  fn: { apply: (arg0: any, arg1: any) => void },
  delay: number | undefined
) {
  let timer: number;
  return function (this: any, ...args: any) {
    if (timer > 0) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = -1;
    }, delay) as unknown as number;
  };
}

/**
 * throttle function
 * @param {*} fn Functions to execute
 * @param {*} delay Interval time
 * @returns function
 */
export function throttle(
  fn: { apply: (arg0: any, arg1: any[]) => void },
  delay: number
) {
  let previousTime = 0;
  return function (this: any, ...args: any[]) {
    // eslint-disable-next-line prefer-rest-params
    const now = Date.now();
    if (now - previousTime > delay) {
      fn.apply(this, args);
      previousTime = now;
    }
  };
}

/**
 * Make the dom element fullscreen
 * @param {dom} element dom element
 * @example
 * setFullscreen(document.documentElement) // The entire page goes full screen
 * setFullscreen(document.getElementById("id")) // An element goes full screen
 */
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

/**
 * exitFullscreen
 * @example
 * exitFullscreen();
 */
export function exitFullScreen() {
  if (
    !document?.fullscreenElement &&
    !(document as any)?.webkitFullscreenElement &&
    !(document as any)?.mozFullScreenElement
  ) {
    return;
  }
  const exitFullScreenDocument = document as Document & {
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

/**
 * Get the value of the specified key from window.location.href
 * @param {*} key The key to get
 * @returns The value corresponding to the key specified in window.location.href.
 * @example
 * const value = getUrlParam(key);
 */
export function getUrlParam(key: string) {
  const url = window?.location.href.replace(/^[^?]*\?/, '');
  const regexp = new RegExp(`(^|&)${key}=([^&#]*)(&|$|)`, 'i');
  const paramMatch = url?.match(regexp);

  return paramMatch ? paramMatch[2] : null;
}

/**
 * deepClone
 * @param data Raw data of any type
 * @returns Data after deepClone
 */
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
    Object.keys(data).forEach(key => {
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
export const isStringNumber = (value: any) =>
  typeof value === 'string' && !isNaN(Number(value));
export const isFunction = (value: any) => typeof value === 'function';

export function addSuffix(value: string | number, suffix = 'px') {
  if (isNumber(value) || isStringNumber(value)) {
    return value + suffix;
  }
  return value;
}

export function getUrlWithRoomId(roomId: string): string {
  if (isWeChat) return '';
  const currentUrl = window.location.href;
  const urlObj = new URL(currentUrl);
  const params = new URLSearchParams(urlObj.search);
  if (params.has('roomId')) {
    params.delete('roomId');
  }
  params.append('roomId', roomId);
  return `${`${urlObj.origin + urlObj.pathname}#/home?${params.toString()}`}`;
}

export function calculateByteLength(str: string) {
  let byteLength = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) {
      byteLength += 1;
    } else if (code <= 0x7ff) {
      byteLength += 2;
    } else if (code <= 0xffff) {
      byteLength += 3;
    } else {
      byteLength += 4;
    }
  }
  return byteLength;
}

export function objectMerge(...args: any[]) {
  return args.reduce((acc, cur) => {
    Object.keys(cur).forEach(key => {
      if (acc[key] && typeof acc[key] === 'object') {
        acc[key] = objectMerge(acc[key], cur[key]);
      } else {
        acc[key] = cur[key];
      }
    });
    return acc;
  }, {});
}

export function convertSecondsToHMS(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return {
    hours,
    minutes,
    seconds: remainingSeconds,
  };
}

export function getNanoId(size = 21) {
  const urlAlphabet =
    'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
  let id = '';
  // A compact alternative for `for (var i = 0; i < step; i++)`.
  let i = size;
  while (i) {
    // `| 0` is more compact and faster than `Math.floor()`.
    id += urlAlphabet[(Math.random() * 64) | 0];
    i = i - 1;
  }
  return id;
}

export function findLastIndex<T>(
  array: T[],
  predicate: (value: T, index: number, obj: T[]) => boolean,
  thisArg?: any
): number {
  const len = array.length >>> 0;

  let k = len - 1;
  while (k >= 0) {
    const kValue = array[k];
    if (predicate.call(thisArg, kValue, k, array)) {
      return k;
    }
    k = k - 1;
  }
  return -1;
}

export function formatTimestampToTime(
  timestamp: number,
  format = 'MM-DD HH:mm'
): string {
  const date = new Date(timestamp);
  const padStart = (value: number, length = 2) =>
    value.toString().padStart(length, '0');

  const replacements: { [key: string]: string } = {
    YYYY: date.getFullYear().toString(),
    YY: (date.getFullYear() % 100).toString().padStart(2, '0'),
    MM: padStart(date.getMonth() + 1),
    DD: padStart(date.getDate()),
    HH: padStart(date.getHours()),
    hh: padStart(date.getHours() % 12),
    mm: padStart(date.getMinutes()),
    ss: padStart(date.getSeconds()),
    A: date.getHours() >= 12 ? 'PM' : 'AM',
  };

  // console.log(formatTimestampToTime(Date.now())); // "10-24 16:20"
  // console.log(formatTimestampToTime(Date.now(), 'YYYY-MM-DD HH:mm:ss')); // "2024-10-24 16:20:30"
  // console.log(formatTimestampToTime(Date.now(), 'MM-DD hh:mm A')); // "10-24 04:20 PM"
  return format.replace(
    /YYYY|YY|MM|DD|HH|hh|mm|ss|A/g,
    match => replacements[match]
  );
}

export type Comparator<T> = (a: T, b: T) => -1 | 0 | 1;
/**
 * Creates a new combined {@link Comparator<T>} which sorts items by the given comparators.
 * The comparators are applied in the order they are given (left -> right).
 *
 * @param comparators the comparators to use for sorting.
 * @returns a combined {@link Comparator<T>}.
 */
export const combineComparators = <T>(
  ...comparators: Comparator<T>[]
): Comparator<T> => {
  return (a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
};

export const createComparator = <T>(
  compareRules: (data1: T, data2: T) => boolean
) => {
  return (a: T, b: T) => {
    if (compareRules(a, b) && compareRules(b, a)) {
      return 0;
    }
    if (compareRules(a, b)) {
      return -1;
    }
    if (compareRules(b, a)) {
      return 1;
    }
    return 0;
  };
};

export function arrayIsEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (
      typeof arr1[i] === 'object' &&
      typeof arr2[i] === 'object' &&
      arr1[i] !== null &&
      arr2[i] !== null
    ) {
      if (!arrayIsEqual(arr1[i] as any, arr2[i] as any)) {
        return false;
      }
    } else {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
  }

  return true;
}
