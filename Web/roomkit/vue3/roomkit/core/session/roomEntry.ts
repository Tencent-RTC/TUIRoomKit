import { readonly, ref } from 'vue';
import { createAbortError } from '../abort';
import type { PasswordChallenge } from './roomEntryError';

export type RoomEntryStep = 'login' | 'profile' | 'joining';
export type RoomEntryPhase = 'idle' | RoomEntryStep | 'password';
export type RoomEntryKind = 'join' | 'create';

/** Module scoped so the kit and the conference overlays share one entry flow. */
const phase = ref<RoomEntryPhase>('idle');
const kind = ref<RoomEntryKind>('join');
const passwordChallenge = ref<PasswordChallenge>();

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
  kind.value = nextKind;
  phase.value = nextStep;
}

function setStep(nextStep: RoomEntryStep): void {
  phase.value = nextStep;
}

function finish(): void {
  rejectPasswordWaiter(entryAbortError());
  passwordChallenge.value = undefined;
  phase.value = 'idle';
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
    passwordChallenge.value = challenge;
    phase.value = 'password';
  });
}

function submitPassword(password: string): void {
  const waiter = passwordWaiter;
  if (!waiter) {
    return;
  }
  passwordWaiter = null;
  passwordChallenge.value = undefined;
  phase.value = 'joining';
  waiter.resolve(password);
}

function cancelPassword(): void {
  rejectPasswordWaiter(entryAbortError());
}

/**
 * Headless entry phase machine. The kit drives the steps; the app reads
 * `phase` / `passwordChallenge` and maps them to copy.
 *
 * A singleton rather than a `use*` hook: it holds no per-caller state and its
 * main caller is the `RoomKit` class, which runs outside any component setup.
 */
export const roomEntry = {
  phase: readonly(phase),
  kind: readonly(kind),
  passwordChallenge: readonly(passwordChallenge),
  begin,
  setStep,
  finish,
  requestPassword,
  submitPassword,
  cancelPassword,
};
