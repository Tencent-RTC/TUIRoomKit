/**
 * Run tasks one after another on a shared chain.
 *
 * Preferred over an "in flight" boolean for operations whose result the caller
 * acts on: dropping a concurrent call would hand back a success the task never
 * actually performed.
 */
export function createSerialRunner() {
  let chain: Promise<unknown> = Promise.resolve();
  return function run<T>(task: () => Promise<T>): Promise<T> {
    const result = chain.then(task, task);
    chain = result.catch(() => undefined);
    return result;
  };
}
