/* eslint-disable class-methods-use-this -- */
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { callExperimentalAPI as atomicxCallExperimentalAPI } from 'tuikit-atomicx-react';
import {
  LoginEvent,
  RoomType,
  loginClient,
  roomClient,
  useRoomEngine,
} from 'tuikit-atomicx-react/room';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import {
  handleJoinRoomError,
  roomLifeCycleStore,
} from '../hooks/useRoomLifeCycle';
import { eventCenter } from '../utils/eventCenter';
import { InterceptorAction, RoomEvent } from './type';
import type { FeatureConfig, InterceptorHandler } from './type';
import type { CreateRoomOptions } from 'tuikit-atomicx-react/room';

type EventCallback = (data?: unknown) => void;

// Reactive feature-config store. Lives at module scope (vanilla zustand) so it
// can be read/written from non-React contexts (the `Conference` class) and
// observed from React components via `useFeatureConfig`. Mirrors the project's
// existing `roomLifeCycleStore` pattern.
const featureConfigStore = createStore<FeatureConfig>(() => ({
  aiTools: { enable: false },
}));

class Conference {
  private interceptorHandlers: Map<InterceptorAction, Set<InterceptorHandler>> = new Map();

  constructor() {
    this.initLoginEventListeners();
  }

  private initLoginEventListeners() {
    loginClient.subscribeEvent(LoginEvent.onKickedOffline, () => {
      eventCenter.emit(RoomEvent.KICKED_OFFLINE);
    });
    loginClient.subscribeEvent(LoginEvent.onLoginExpired, () => {
      eventCenter.emit(RoomEvent.USER_SIG_EXPIRED);
    });
  }

  public async login(params: {
    sdkAppId: number;
    userId: string;
    userSig: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }) {
    const { sdkAppId, userId, userSig, ...rest } = params;
    await loginClient.login({
      userId,
      userSig,
      sdkAppId,
      ...rest,
    });
  }

  public setSelfInfo(options: { userName: string; avatarUrl: string }) {
    return loginClient.setSelfInfo(options);
  }

  public async logout() {
    return loginClient.logout();
  }

  public getRoomEngine() {
    const roomEngine = useRoomEngine() as { instance: TUIRoomEngine } | null;
    if (!roomEngine) {
      // eslint-disable-next-line no-console
      console.warn('getRoomEngine failed, roomEngine is not exist');
    }
    return roomEngine;
  }

  public on(eventType: RoomEvent, callback: EventCallback) {
    eventCenter.on(eventType, callback);
  }

  public off(eventType: RoomEvent, callback: EventCallback) {
    eventCenter.off(eventType, callback);
  }

  public async createAndJoinRoom({
    roomId,
    roomType,
    options,
  }: {
    roomId: string;
    roomType?: RoomType;
    options?: CreateRoomOptions;
  }) {
    const { setIsJoiningRoom } = roomLifeCycleStore.getState();
    setIsJoiningRoom(true);
    try {
      await roomClient.createAndJoinRoom({
        roomId,
        roomType,
        options: options ?? ({} as CreateRoomOptions),
      });
    } catch (error) {
      handleJoinRoomError(error);
      return;
    } finally {
      setIsJoiningRoom(false);
    }
  }

  public async joinRoom({
    roomId,
    roomType,
    password,
  }: {
    roomId: string;
    roomType?: RoomType;
    password?: string;
  }) {
    const {
      setIsJoiningRoom,
      setJoiningRoomId,
      setRoomPasswordVisible,
    } = roomLifeCycleStore.getState();
    // Reset before each attempt so the PasswordDialog watch reliably fires
    // (false → true) when ERR_NEED_PASSWORD comes back.
    setRoomPasswordVisible(false);
    setIsJoiningRoom(true);
    setJoiningRoomId(roomId);
    try {
      await roomClient.joinRoom({
        roomId,
        roomType: roomType || RoomType.Standard,
        password,
      });
      // Only clear on success. On failure (e.g. ERR_NEED_PASSWORD /
      // ERR_WRONG_PASSWORD) the id is intentionally preserved so the
      // PasswordDialog can reuse it for the next attempt.
      setJoiningRoomId('');
    } catch (error) {
      handleJoinRoomError(error);
      return;
    } finally {
      setIsJoiningRoom(false);
    }
  }

  public async leaveRoom() {
    await roomClient.leaveRoom();
    eventCenter.emit(RoomEvent.ROOM_LEAVE);
  }

  public async endRoom() {
    await roomClient.endRoom();
  }

  public onWill(action: InterceptorAction, handler: InterceptorHandler): () => void {
    if (!this.interceptorHandlers.has(action)) {
      this.interceptorHandlers.set(action, new Set());
    }
    this.interceptorHandlers.get(action)!.add(handler);
    return () => {
      this.interceptorHandlers.get(action)?.delete(handler);
    };
  }

  public async executeInterceptor(
    action: InterceptorAction,
    proceed: () => void | Promise<void>,
    abort?: () => void,
  ): Promise<void> {
    const handlers = this.interceptorHandlers.get(action);
    if (!handlers || handlers.size === 0) {
      await proceed();
      return;
    }
    const handlerArray = Array.from(handlers);
    let currentIndex = 0;

    const next = async (): Promise<void> => {
      if (currentIndex >= handlerArray.length) {
        await proceed();
        return;
      }
      const handler = handlerArray[currentIndex];
      currentIndex += 1;
      await handler(action, next, abort || (() => {}));
    };

    await next();
  }

  public setFeatureConfig(config: Partial<FeatureConfig>) {
    // TODO(react-migration): wire up `dataReport.reportCount(
    //   MetricsKey.T_METRICS_STATE_API_SET_FEATURE_CONFIG_COUNT,
    // )` once the metrics module is ported from the Vue3 sibling.
    featureConfigStore.setState((prev) => {
      const next: FeatureConfig = { ...prev };
      (Object.keys(config) as (keyof FeatureConfig)[]).forEach((key) => {
        const newValue = config[key];
        const existingValue = next[key];
        // Shallow-merge plain-object subfields into a fresh reference so
        // selectors only re-render for fields whose value actually changed,
        // while previously set sibling fields are preserved.
        if (
          newValue !== null
          && typeof newValue === 'object'
          && !Array.isArray(newValue)
          && typeof newValue !== 'function'
          && existingValue !== null
          && typeof existingValue === 'object'
          && !Array.isArray(existingValue)
          && typeof existingValue !== 'function'
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (next as any)[key] = { ...existingValue, ...(newValue as object) };
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (next as any)[key] = newValue;
        }
      });
      return next;
    }, true);
  }

  public getFeatureConfig<K extends keyof FeatureConfig>(
    key: K,
  ): FeatureConfig[K] | undefined {
    return featureConfigStore.getState()[key];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public callExperimentalAPI<T extends string>({
    api,
    params,
  }: {
    api: T;
    params?: Record<string, any>;
  }): void {
    atomicxCallExperimentalAPI({ api, params });
  }
}

export const conference = new Conference();

/**
 * Subscribe a React component to a single `featureConfig` entry.
 *
 * Re-renders whenever {@link Conference.setFeatureConfig} mutates that key,
 * so callers can mirror Vue's `watch(() => conference.getFeatureConfig(key))`
 * without polling. Object/array values get a new top-level reference whenever
 * any of their subfields change, so selector identity reflects "did this key
 * actually change".
 */
export function useFeatureConfig<K extends keyof FeatureConfig>(
  key: K,
): FeatureConfig[K] | undefined {
  return useStore(featureConfigStore, state => state[key]);
}
