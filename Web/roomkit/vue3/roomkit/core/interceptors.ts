import type { InterceptorAction, InterceptorHandler } from './types';

const interceptors = new Map<InterceptorAction, Set<InterceptorHandler>>();

export function addInterceptor(action: InterceptorAction, handler: InterceptorHandler): () => void {
  const handlers = interceptors.get(action) ?? new Set<InterceptorHandler>();
  handlers.add(handler);
  interceptors.set(action, handlers);
  return () => {
    handlers.delete(handler);
  };
}

export function hasInterceptor(action: InterceptorAction): boolean {
  return (interceptors.get(action)?.size ?? 0) > 0;
}

/** Runs handlers in registration order; `false` or a throw cancels the action and skips the rest. */
export async function runInterceptors(action: InterceptorAction): Promise<boolean> {
  for (const handler of [...(interceptors.get(action) ?? [])]) {
    try {
      // Each handler may open its own dialog, so they must not overlap.
      // eslint-disable-next-line no-await-in-loop
      if (await handler() === false) {
        return false;
      }
    } catch (error) {
      console.error(`[RoomKit.onWill] ${action} interceptor failed; the action was cancelled:`, error);
      return false;
    }
  }
  return true;
}
