import { MessageStatus } from 'tuikit-atomicx-react/chat';

type LoadMessages = () => Promise<unknown>;

/**
 * Shares the first history request between unread tracking (ChatContextSync)
 * and the chat panel (MessageList), so the initial load runs once per channel.
 * React-only plumbing: Vue relies on its chat context to tolerate the
 * duplicate initial `loadMessages` calls.
 */
const initialHistoryTasks = new Map<string, Promise<unknown>>();

/** Distance from the top that still counts as "reached history". */
export const HISTORY_LOAD_OFFSET = 48;
/** First load only returns one SDK page (20). Prefetch more so refresh is not empty. */
export const INITIAL_HISTORY_LIMIT = 80;
export const INITIAL_HISTORY_PAGES = 3;

/**
 * Share the first history request between unread tracking and the chat panel.
 */
export function ensureInitialHistory(channel: string, loadMessages: LoadMessages) {
  const existing = initialHistoryTasks.get(channel);
  if (existing) {
    return existing;
  }

  let task: Promise<unknown>;
  try {
    task = Promise.resolve(loadMessages());
  } catch (error) {
    task = Promise.reject(error);
  }
  initialHistoryTasks.set(channel, task);
  const clearTask = () => {
    if (initialHistoryTasks.get(channel) === task) {
      initialHistoryTasks.delete(channel);
    }
  };
  task.then(clearTask, clearTask);
  return task;
}

export function shouldPrefetchOlderHistory(options: {
  loadedCount: number;
  hasOlder: boolean;
  extraPages: number;
}): boolean {
  return options.hasOlder
    && options.loadedCount < INITIAL_HISTORY_LIMIT
    && options.extraPages < INITIAL_HISTORY_PAGES;
}

/**
 * Load older pages when the user is at the top of a settled list.
 * Skip the send-image case: in-flight rows, a short cooldown after send,
 * or a list so short that top and bottom are the same gesture.
 */
export function shouldLoadOlderMessages(options: {
  offset: number;
  nearBottom: boolean;
  distanceFromBottom: number;
  loading: boolean;
  hasOlder: boolean;
  hasInFlight?: boolean;
  suppressed?: boolean;
}): boolean {
  if (
    options.nearBottom
    || options.loading
    || !options.hasOlder
    || options.hasInFlight
    || options.suppressed
  ) {
    return false;
  }
  if (options.offset > HISTORY_LOAD_OFFSET) {
    return false;
  }
  if (options.distanceFromBottom <= HISTORY_LOAD_OFFSET) {
    return false;
  }
  return true;
}

export function historyWasPrepended(
  previousFirstId: string | undefined,
  nextFirstId: string | undefined,
): boolean {
  return Boolean(previousFirstId && nextFirstId && previousFirstId !== nextFirstId);
}

/** A local send that the SDK has not confirmed yet. */
export function isInFlightMessage(
  message: { isSentBySelf?: boolean },
  status: MessageStatus,
): boolean {
  return Boolean(message.isSentBySelf)
    && (status === MessageStatus.InitStatus || status === MessageStatus.Sending);
}

/** Keep local in-flight rows last so a history merge cannot hoist them. */
export function keepInFlightAtEnd<T>(
  messages: T[],
  isInFlight: (message: T) => boolean,
): T[] {
  const settled: T[] = [];
  const inFlight: T[] = [];
  for (const message of messages) {
    if (isInFlight(message)) {
      inFlight.push(message);
    } else {
      settled.push(message);
    }
  }
  if (inFlight.length === 0) {
    return messages;
  }
  return [...settled, ...inFlight];
}
