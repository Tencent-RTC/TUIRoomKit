/*
 * @Description: 
 * @Date: 2022-04-11 19:39:55
 * @LastEditTime: 2022-04-12 16:00:41
 */
export function getType(input: any) {
  // @ts-ignore
  return Object.prototype.toString
    .call(input)
    .match(/^\[object (.*)\]$/)[1]
    .toLowerCase();
}

export function isObject(input: any) {
  // null is object, hence the extra check
  return input !== null && typeof input === 'object';
}

export function isArray(input: any) {
  if (typeof Array.isArray === 'function') {
    return Array.isArray(input);
  }
  return getType(input) === 'array';
}

export function isArrayOrObject(input: any) {
  return isArray(input) || isObject(input);
}

export function isInstanceOfError(input: any) {
  return input instanceof Error;
}

export function stringifyError(error: any) {
  return JSON.stringify(error, ['message', 'code']);
}

export function simpleClone(obj: Record<string, any>) {
  return JSON.parse(JSON.stringify(obj));
}

export function safelyParseJSON(json: string) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    console.error('JSON parse exception', json);
    return {};
  }
  return parsed;
}
