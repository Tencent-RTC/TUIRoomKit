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
): Comparator<T> => (a, b) => {
  for (const comparator of comparators) {
    const result = comparator(a, b);
    if (result !== 0) {
      return result;
    }
  }
  return 0;
};

export const createComparator = <T>(
  compareRules: (data1: T, data2: T) => boolean,
) => (a: T, b: T) => {
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
