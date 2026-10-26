import {
  LoginEvent,
  LoginStatus,
  RoomEvent as AtomicRoomEvent,
  RoomParticipantEvent,
  loginClient,
  roomClient,
  roomParticipantClient,
} from 'tuikit-atomicx-react/room';
import type { KickedOutOfRoomReason } from 'tuikit-atomicx-react/room';
import { t } from '../i18n';
import { createAbortError, isAbortError } from './abort';
import { addInterceptor } from './interceptors';
import { roomEntry } from './session';
import { getPasswordChallenge, getRoomEntryFailureReason, RoomCleanupError } from './session/roomEntryError';
import { setUIConfig as applyUIConfig } from '../base';
import type { UIConfig } from '../base';
import { atomicState, RoomKitMount, resolveMountTarget } from './mount';
import { ExitReason } from './types';
import { validateParameters } from './validation';
import type {
  Credentials,
  CreateAndJoinOptions,
  ExitedPayload,
  InterceptorAction,
  InterceptorHandler,
  RoomKitEventMap,
  RoomKitJoinOptions,
} from './types';
import type { RoomEntryKind } from './session';

interface RoomSession {
  roomId: string;
  controller: AbortController;
  unsubscribeParticipantExit?: () => void;
}

interface FinishSessionOptions {
  session?: RoomSession;
  reason?: ExitReason;
  error?: unknown;
}

export class RoomKit {
  private static instance: RoomKit | undefined;
  private static operationQueue: Promise<void> = Promise.resolve();
  private static readonly retiredInstances = new Set<RoomKit>();
  private static readonly SIGN_IN_WAIT_MS = 8000;

  private static enqueueOperation(operation: () => Promise<void>): Promise<void> {
    const operationResult = this.operationQueue.then(operation);
    this.operationQueue = operationResult.catch(() => {});
    return operationResult;
  }

  private static async disposeRetiredInstances(): Promise<void> {
    for (const instance of this.retiredInstances) {
      // Serial dispose: each instance may still hold SDK resources.
      // eslint-disable-next-line no-await-in-loop
      await instance.dispose();
      this.retiredInstances.delete(instance);
    }
  }

  private static retire(instance: RoomKit): void {
    // Retiring invalidates the outgoing singleton in place.
    // eslint-disable-next-line no-param-reassign
    instance.isInvalidated = true;
    instance.cancelPendingEntries();
    this.retiredInstances.add(instance);
  }

  private readonly exitHandlers = new Set<(payload: ExitedPayload) => void>();
  private readonly unsubscribes: Array<() => void> = [];
  private readonly view = new RoomKitMount();
  private readonly pendingEntries = new Set<RoomSession>();
  private currentSession?: RoomSession;
  private isInvalidated = false;
  private isRoomExitSuppressed = false;
  private hasPendingRoomCleanup = false;

  private readonly credentials: Credentials;
  private readonly initialization: Promise<void>;

  private constructor(credentials: Credentials, initialization: Promise<void>) {
    this.credentials = credentials;
    this.initialization = initialization;
    this.subscribeToExitEvents();
  }

  @validateParameters('getInstance')
  static getInstance(credentials: Credentials): RoomKit {
    const previous = this.instance;
    if (previous && previous.credentials.sdkAppId === credentials.sdkAppId && previous.credentials.userId === credentials.userId) {
      Object.assign(previous.credentials, credentials);
      return previous;
    }
    if (previous) {
      this.retire(previous);
    }
    // Keep the rejection observable by the new instance's APIs. Failed disposal
    // also stays in retiredInstances so destroyInstance can retry it.
    const initialization = this.enqueueOperation(() => this.disposeRetiredInstances());
    this.instance = new RoomKit({ ...credentials }, initialization);
    return this.instance;
  }

  @validateParameters('destroyInstance')
  static async destroyInstance(): Promise<void> {
    const { instance } = this;
    if (instance) {
      this.retire(instance);
      this.instance = undefined;
    }
    await this.enqueueOperation(() => this.disposeRetiredInstances());
  }

  @validateParameters('createAndJoin')
  createAndJoin(options: CreateAndJoinOptions): Promise<void> {
    const { container, roomId, ...roomOptions } = options;
    return this.enter('create', { roomId, container }, () => roomClient.createAndJoinRoom({ roomId, options: roomOptions }));
  }

  @validateParameters('join')
  join(options: RoomKitJoinOptions): Promise<void> {
    const { roomId, container, password } = options;
    return this.enter('join', { roomId, container }, session => this.joinWithPasswordChallenge(session, password));
  }

  @validateParameters('leave')
  leave(): Promise<void> {
    this.cancelPendingEntries();
    return this.enqueue('leave', () => this.leaveCurrent());
  }

  @validateParameters('end')
  end(): Promise<void> {
    this.cancelPendingEntries();
    return this.enqueue('end', async () => {
      await this.ensureLogin();
      await this.withRoomExitSuppressed(async () => {
        await roomClient.endRoom();
        this.hasPendingRoomCleanup = false;
        this.finishSession();
      });
    });
  }

  @validateParameters('setUIConfig')
  setUIConfig(options: UIConfig): void {
    this.assertUsable('setUIConfig');
    applyUIConfig(options);
  }

  @validateParameters('on')
  on<K extends keyof RoomKitEventMap>(event: K, handler: (payload: RoomKitEventMap[K]) => void): () => void {
    this.exitHandlers.add(handler);
    return () => this.off(event, handler);
  }

  @validateParameters('off')
  off<K extends keyof RoomKitEventMap>(_event: K, handler: (payload: RoomKitEventMap[K]) => void): void {
    this.exitHandlers.delete(handler);
  }

  /** While any interceptor is registered, it replaces the built-in confirmation for that action. */
  @validateParameters('onWill')
  onWill(action: InterceptorAction, handler: InterceptorHandler): () => void {
    this.assertUsable('onWill');
    const remove = addInterceptor(action, handler);
    this.unsubscribes.push(remove);
    return remove;
  }

  private assertUsable(api: string): void {
    if (!this.isInvalidated) {
      return;
    }
    const reason = t('RoomKitDeveloper.Disposed');
    const solution = t('RoomKitDeveloper.DisposedSolution');
    throw new Error(`[RoomKit.${api}] ${reason} ${solution}`);
  }

  private enqueue(api: string, operation: () => Promise<void>): Promise<void> {
    return RoomKit.enqueueOperation(async () => {
      this.assertUsable(api);
      await this.initialization;
      this.assertUsable(api);
      await operation();
    });
  }

  private enter(
    kind: RoomEntryKind,
    options: Pick<RoomKitJoinOptions, 'roomId' | 'container'>,
    operation: (session: RoomSession) => Promise<void>,
  ): Promise<void> {
    const mountTarget = resolveMountTarget(options.container.appendTo);
    const container = { ...options.container };
    const session: RoomSession = { roomId: options.roomId, controller: new AbortController() };
    const api = kind === 'create' ? 'createAndJoin' : 'join';
    this.pendingEntries.add(session);

    return this.enqueue(api, async () => {
      session.controller.signal.throwIfAborted();
      await this.leaveCurrent();
      session.controller.signal.throwIfAborted();
      this.currentSession = session;

      try {
        roomEntry.begin(kind, 'login');
        this.view.mount({ mountTarget, container, roomName: session.roomId });
        await Promise.resolve();
        this.assertCurrentSession(session);

        await this.ensureLogin(session.controller.signal);
        this.assertCurrentSession(session);
        roomEntry.setStep('profile');
        await this.syncSelfInfo();
        this.assertCurrentSession(session);

        roomEntry.setStep('joining');
        await operation(session);
        this.assertCurrentSession(session);
        // Subscribe after the SDK room exists. useRoomParticipantState() constructs
        // CallEventManager, which treats undefined === undefined as "this room" and
        // would otherwise keep previous invitees in the process-wide pending map.
        session.unsubscribeParticipantExit = this.subscribeToParticipantExit(session);
        roomEntry.finish();
      } catch (error) {
        throw await this.handleEnterFailure(session, error);
      }
    }).finally(() => this.pendingEntries.delete(session));
  }

  private async joinWithPasswordChallenge(session: RoomSession, initialPassword?: string): Promise<void> {
    const { joinRoom } = roomClient;
    let password = initialPassword;
    while (true) {
      this.assertCurrentSession(session);
      try {
        // Password retries must stay sequential against the same session.
        // eslint-disable-next-line no-await-in-loop
        await joinRoom({ roomId: session.roomId, password });
        return;
      } catch (error) {
        const challenge = getPasswordChallenge(error);
        if (!challenge) {
          throw error;
        }
        this.assertCurrentSession(session);
        // eslint-disable-next-line no-await-in-loop
        password = await roomEntry.requestPassword(session.controller.signal, challenge);
      }
    }
  }

  /** Cancellation must bypass the SDK queue to release pending UI interactions. */
  private cancelPendingEntries(): void {
    this.pendingEntries.forEach(session => session.controller.abort());
  }

  private async handleEnterFailure(session: RoomSession, error: unknown): Promise<unknown> {
    // An exit event can close the view while the SDK join is still in flight.
    // The queue still belongs to this entry, so roll back any late SDK success.
    let failure = error;
    try {
      await this.rollbackRoom(session);
    } catch (cleanupError) {
      failure = new RoomCleanupError(error, cleanupError);
    }
    if (this.currentSession !== session) {
      return failure;
    }
    try {
      if (!isAbortError(failure) && this.view.isMounted) {
        this.view.notifyEnterFailed(
          roomEntry.kind,
          getRoomEntryFailureReason(failure, roomEntry.phase),
        );
      }
    } finally {
      this.finishSession({ session, reason: ExitReason.EnterFailed, error: failure });
    }
    return failure;
  }

  private async rollbackRoom(session: RoomSession): Promise<void> {
    if (atomicState.currentRoomId === session.roomId) {
      await this.leaveSdkRoom();
    }
  }

  private assertCurrentSession(session: RoomSession): void {
    session.controller.signal.throwIfAborted();
    if (this.isInvalidated || this.currentSession !== session) {
      throw createAbortError('Room entry was cancelled.');
    }
  }

  private isSignedIn(): boolean {
    return atomicState.loginStatus === LoginStatus.LOGINED && atomicState.loginUserId === this.credentials.userId;
  }

  /**
   * Schedule refresh or the host app may already be signing in. A second
   * TUILogin.login() fails; wait for that in-flight result instead of
   * reporting it as an entry login failure.
   */
  private async ensureLogin(signal?: AbortSignal): Promise<void> {
    if (this.isSignedIn()) {
      return;
    }
    try {
      await loginClient.login(this.credentials);
    } catch (error) {
      if (this.isSignedIn() || await this.waitForSignedIn(signal)) {
        return;
      }
      throw error;
    }
  }

  private waitForSignedIn(signal?: AbortSignal): Promise<boolean> {
    if (signal?.aborted) {
      throw createAbortError('Room entry was cancelled.');
    }
    if (this.isSignedIn()) {
      return Promise.resolve(true);
    }
    return new Promise((resolve, reject) => {
      const stop = atomicState.subscribe(() => {
        if (this.isSignedIn()) {
          cleanup();
          resolve(true);
        }
      });
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, RoomKit.SIGN_IN_WAIT_MS);
      const onAbort = () => {
        cleanup();
        reject(createAbortError('Room entry was cancelled.'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      const cleanup = () => {
        stop();
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
      };
    });
  }

  private async syncSelfInfo(): Promise<void> {
    const { userName, avatarUrl } = this.credentials;
    if (userName !== undefined || avatarUrl !== undefined) {
      await loginClient.setSelfInfo({
        ...(userName !== undefined ? { userName } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      });
    }
  }

  /** Clear the active flow before notifying callers, so reentrant/stale callbacks cannot finish it twice. */
  private finishSession({ session = this.currentSession, reason, error }: FinishSessionOptions = {}): void {
    if (!session || session !== this.currentSession) {
      return;
    }
    this.currentSession = undefined;
    session.controller.abort();
    session.unsubscribeParticipantExit?.();
    roomEntry.finish();
    this.view.unmount();
    if (reason && !this.isInvalidated) {
      this.emitExited({
        roomId: session.roomId,
        reason,
        ...(error !== undefined ? { error } : {}),
        ...(this.hasPendingRoomCleanup ? { cleanupPending: true } : {}),
      });
    }
  }

  private async leaveCurrent(): Promise<void> {
    if (atomicState.currentRoomId || this.hasPendingRoomCleanup) {
      await this.leaveSdkRoom();
    }
    this.finishSession();
  }

  private async leaveSdkRoom(): Promise<void> {
    this.hasPendingRoomCleanup = true;
    await this.withRoomExitSuppressed(() => roomClient.leaveRoom());
    this.hasPendingRoomCleanup = false;
  }

  private async withRoomExitSuppressed(operation: () => Promise<void>): Promise<void> {
    this.isRoomExitSuppressed = true;
    try {
      await operation();
    } finally {
      this.isRoomExitSuppressed = false;
    }
  }

  private subscribeToParticipantExit(session: RoomSession): () => void {
    const participantState = roomParticipantClient;
    const onKickedFromRoom = ({ reason }: { reason: KickedOutOfRoomReason }) => {
      if (!this.isInvalidated && !this.isRoomExitSuppressed && this.currentSession === session) {
        this.view.notifyKickedOut(reason);
        this.hasPendingRoomCleanup = false;
        this.finishSession({ session, reason: ExitReason.KickedOut });
      }
    };
    participantState.subscribeEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom);
    return () => participantState.unsubscribeEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom);
  }

  private subscribeToExitEvents(): void {
    const roomState = roomClient;
    const onRoomEnded = (event?: { roomInfo?: { roomId?: string } }) => {
      const endedRoomId = event?.roomInfo?.roomId;
      if (
        this.isInvalidated
        || this.isRoomExitSuppressed
        || !this.currentSession
        || (endedRoomId && endedRoomId !== this.currentSession.roomId)
      ) {
        return;
      }
      this.hasPendingRoomCleanup = false;
      this.view.notifyRoomEnded();
      this.finishSession({ reason: ExitReason.RoomDismiss });
    };
    roomState.subscribeEvent(AtomicRoomEvent.onRoomEnded, onRoomEnded);
    this.unsubscribes.push(() => roomState.unsubscribeEvent(AtomicRoomEvent.onRoomEnded, onRoomEnded));

    let previousRoomId = atomicState.currentRoomId;
    this.unsubscribes.push(atomicState.subscribe(() => {
      const roomId = atomicState.currentRoomId;
      if (roomId === previousRoomId) {
        return;
      }
      const lastRoomId = previousRoomId;
      previousRoomId = roomId;
      this.handleRoomIdChange(roomId, lastRoomId);
    }));

    const { subscribeEvent, unsubscribeEvent } = loginClient;
    const loginEvents: Array<[LoginEvent, ExitReason]> = [
      [LoginEvent.onKickedOffline, ExitReason.KickedOffline],
      [LoginEvent.onLoginExpired, ExitReason.UserSigExpired],
    ];
    loginEvents.forEach(([event, reason]) => {
      const handler = () => {
        if (!this.isInvalidated && this.currentSession) {
          this.finishSession({ reason });
        }
      };
      subscribeEvent(event, handler);
      this.unsubscribes.push(() => unsubscribeEvent(event, handler));
    });
  }

  private handleRoomIdChange(roomId: string | undefined, previousRoomId: string | undefined): void {
    if (
      !previousRoomId
      || roomId === previousRoomId
      || this.currentSession?.roomId !== previousRoomId
      || this.isInvalidated
      || this.isRoomExitSuppressed
    ) {
      return;
    }
    if (roomId) {
      this.finishSession({ reason: ExitReason.RoomLeave });
      return;
    }
    queueMicrotask(() => {
      if (
        this.currentSession?.roomId === previousRoomId
        && !this.isInvalidated
        && !this.isRoomExitSuppressed
      ) {
        this.finishSession({ reason: ExitReason.RoomLeave });
      }
    });
  }

  private emitExited(payload: ExitedPayload): void {
    for (const handler of [...this.exitHandlers]) {
      try {
        Promise.resolve(handler(payload)).catch((error) => {
          console.error('[RoomKit.exited] Listener failed:', error);
        });
      } catch (error) {
        console.error('[RoomKit.exited] Listener failed:', error);
      }
    }
  }

  private async dispose(): Promise<void> {
    const errors: unknown[] = [];
    try {
      await this.leaveCurrent().catch((error) => {
        errors.push(error);
      });
      await this.logoutCurrentUser().catch((error) => {
        errors.push(error);
      });
    } finally {
      this.finishSession();
      this.unsubscribes.splice(0).forEach(unsubscribe => unsubscribe());
      this.exitHandlers.clear();
    }
    if (errors.length) {
      throw new AggregateError(errors, 'RoomKit disposal failed. Retry destroyInstance() before creating another session.');
    }
  }

  private async logoutCurrentUser(): Promise<void> {
    if (atomicState.loginStatus === LoginStatus.LOGINED && atomicState.loginUserId === this.credentials.userId) {
      await loginClient.logout();
    }
  }
}
