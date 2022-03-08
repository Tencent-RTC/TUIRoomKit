export function simpleClone(obj: any) {
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
