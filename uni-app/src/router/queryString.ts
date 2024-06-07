const stringifyPrimitive = function (v: unknown) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

function stringify(obj?: any, sep: string = '&', eq: string = '=', name?: any) {
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return Object.keys(obj)
      .map((k) => {
        const ks = stringifyPrimitive(k) + eq;
        if (Array.isArray(obj[k])) {
          return obj[k]
            .map((v: any) => ks + stringifyPrimitive(v))
            .join(sep);
        }
        return ks + stringifyPrimitive(obj[k]);
      })
      .filter(Boolean)
      .join(sep);
  }

  if (!name) return '';
  return stringifyPrimitive(name) + eq + stringifyPrimitive(obj);
}

export { stringify };
