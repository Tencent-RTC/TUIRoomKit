/** Cancellation travels as a platform AbortError so every caller can share one predicate. */
export function createAbortError(message: string): DOMException {
  return new DOMException(message, 'AbortError');
}

export function isAbortError(value: unknown): boolean {
  return value instanceof DOMException && value.name === 'AbortError';
}
