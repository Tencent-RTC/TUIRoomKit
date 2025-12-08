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

export function getUrlParams(): Record<string, string> {
  const query: Record<string, string> = {};
  const hashQueryIndex = location.href.indexOf('?');
  if (hashQueryIndex !== -1) {
    const hashQueryString = location.href.substring(hashQueryIndex + 1);
    const params = new URLSearchParams(hashQueryString);

    params.forEach((value, key) => {
      query[key] = value;
    });
  }
  return query;
}

/**
 * Generate room link based on current domain and router mode
 * @param roomId Room ID
 * @param password Optional room password
 * @returns Generated room link
 */
export function generateRoomLink(roomId: string, password?: string): string {
  if (!roomId) {
    return '';
  }

  // Use current domain to generate room link
  const baseUrl = `${window.location.protocol}//${window.location.host}`;

  // Detect if using hash router
  const isHashRouter = window.location.hash.includes('#');
  const currentPath = window.location.pathname;

  // Build room parameters
  const roomParams = password
    ? `roomId=${roomId}&password=${password}`
    : `roomId=${roomId}`;

  // Generate link based on router mode
  if (isHashRouter) {
    // Hash router mode: http://localhost:5173/#/room?roomId=xxx
    return `${baseUrl}${currentPath}#/room?${roomParams}`;
  }
  // History router mode: http://localhost:5173/room?roomId=xxx
  return `${baseUrl}/room?${roomParams}`;
}

/**
 * Copy text to clipboard
 * @param text Text to copy
 * @returns Promise<boolean> Success or not
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    // Prefer modern browser Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback: use traditional document.execCommand
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export function generateRoomSchemeLink(roomId: string, password?: string): string {
  if (!roomId) {
    return '';
  }
  return `tuiroom://joinroom?roomId=${roomId}${password ? `&password=${password}` : ''}`;
}
