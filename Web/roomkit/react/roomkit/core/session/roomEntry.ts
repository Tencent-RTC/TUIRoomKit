import { createAbortError } from '../abort';
import type { PasswordChallenge } from './roomEntryError';

export type RoomEntryStep = 'login' | 'profile' | 'joining';
export type RoomEntryPhase = 'idle' | RoomEntryStep | 'password';
export type RoomEntryKind = 'join' | 'create';

/** Module scoped so the kit and the conference overlays share one entry flow. */
export interface RoomEntrySnapshot {
  phase: RoomEntryPhase;
  kind: RoomEntryKind;
  passwordChallenge: PasswordChallenge | undefined;
}

let snapshot: RoomEntrySnapshot = { phase: 'idle', kind: 'join', passwordChallenge: undefined };
const listeners = new Set<() => void>();

function update(patch: Partial<RoomEntrySnapshot>): void {
  const next = { ...snapshot, ...patch };
  if (next.phase === snapshot.phase && next.kind === snapshot.kind && next.passwordChallenge === snapshot.passwordChallenge) {
    return;
  }
  snapshot = next;
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): RoomEntrySnapshot {
  return snapshot;
}

let passwordWaiter: {
  resolve: (password: string) => void;
  reject: (reason: unknown) => void;
} | null = null;

function entryAbortError(): DOMException {
  return createAbortError('Room entry was cancelled.');
}

function rejectPasswordWaiter(reason: unknown): void {
  const waiter = passwordWaiter;
  passwordWaiter = null;
  waiter?.reject(reason);
}

function begin(nextKind: RoomEntryKind = 'join', nextStep: RoomEntryStep = 'joining'): void {
  finish();
  update({ kind: nextKind, phase: nextStep });
}

function setStep(nextStep: RoomEntryStep): void {
  update({ phase: nextStep });
}

function finish(): void {
  rejectPasswordWaiter(entryAbortError());
  update({ passwordChallenge: undefined, phase: 'idle' });
}

function requestPassword(signal: AbortSignal, challenge: PasswordChallenge = 'required'): Promise<string> {
  if (signal.aborted) {
    return Promise.reject(entryAbortError());
  }
  rejectPasswordWaiter(entryAbortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => rejectPasswordWaiter(entryAbortError());
    passwordWaiter = {
      resolve: (password) => {
        signal.removeEventListener('abort', onAbort);
        resolve(password);
      },
      reject: (reason) => {
        signal.removeEventListener('abort', onAbort);
        reject(reason);
      },
    };
    signal.addEventListener('abort', onAbort, { once: true });
    update({ passwordChallenge: challenge, phase: 'password' });
  });
}

function submitPassword(password: string): void {
  const waiter = passwordWaiter;
  if (!waiter) {
    return;
  }
  passwordWaiter = null;
  update({ passwordChallenge: undefined, phase: 'joining' });
  waiter.resolve(password);
}

function cancelPassword(): void {
  rejectPasswordWaiter(entryAbortError());
}

/**
 * Headless entry phase machine. The kit drives the steps; the app reads
 * `phase` / `passwordChallenge` and maps them to copy. React components
 * subscribe with `useSyncExternalStore(roomEntry.subscribe, roomEntry.getSnapshot)`.
 *
 * A singleton rather than a `use*` hook: it holds no per-caller state and its
 * main caller is the `RoomKit` class, which runs outside any component setup.
 */
export const roomEntry = {
  get phase(): RoomEntryPhase {
    return snapshot.phase;
  },
  get kind(): RoomEntryKind {
    return snapshot.kind;
  },
  get passwordChallenge(): PasswordChallenge | undefined {
    return snapshot.passwordChallenge;
  },
  subscribe,
  getSnapshot,
  begin,
  setStep,
  finish,
  requestPassword,
  submitPassword,
  cancelPassword,
};
