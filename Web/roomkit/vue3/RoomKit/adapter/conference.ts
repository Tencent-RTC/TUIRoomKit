import {
  useLoginState,
  useRoomEngine,
  useRoomState,
  useDeviceState,
  RoomType,
  LoginEvent,
} from 'tuikit-atomicx-vue3/room';
import { getCurrentInstance, inject, reactive, shallowReactive, markRaw } from 'vue';
import useRoomLifeCycle from '../hooks/useRoomLifeCycle';
import { eventCenter } from '../utils/eventCenter';
import { widgetDeclarationOrderContextKey } from '../components/CustomWidgetRenderer/context';
import { RoomEvent, StartOptions, JoinOptions, IConference, ComponentName, ComponentConfig, BuiltinWidget, WidgetConfig, WidgetZone, WidgetZoneConfig, WidgetPlatform, InterceptorAction, InterceptorHandler, FeatureConfig } from './type';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { dataReport, MetricsKey } from '../report';

class Conference implements IConference {
  private componentConfig: ComponentConfig[] = [];
  private widgetVisibility = reactive<Record<string, boolean>>({});
  private registeredWidgets = shallowReactive<WidgetConfig[]>([]);
  private widgetRegistrationIndex = 0;
  private interceptorHandlers = new Map<InterceptorAction, Set<InterceptorHandler>>();
  private featureConfig = reactive<FeatureConfig>({});

  constructor() {
    this.initLoginEventListeners();
  }

  private initLoginEventListeners() {
    const { subscribeEvent } = useLoginState();
    subscribeEvent(LoginEvent.onKickedOffline, () => {
      eventCenter.emit(RoomEvent.KICKED_OFFLINE);
    });
    subscribeEvent(LoginEvent.onLoginExpired, () => {
      eventCenter.emit(RoomEvent.USER_SIG_EXPIRED);
    });
  }

  public login(params: {
    sdkAppId: number;
    userId: string;
    userSig: string;
    tim?: any;
  }) {
    const { login } = useLoginState();
    return login({
      userId: params.userId,
      userSig: params.userSig,
      sdkAppId: params.sdkAppId,
    });
  }

  public async logout() {
    const { logout } = useLoginState();
    return logout();
  }

  public getRoomEngine() {
    const roomEngine = useRoomEngine() as { instance: TUIRoomEngine } | null ;
    if (!roomEngine) {
      console.warn('getRoomEngine failed, roomEngine is not exist');
    }
    return roomEngine;
  }

  public on(eventType: RoomEvent, callback: (data?: any) => void) {
    eventCenter.on(eventType, callback);
  }

  public off(eventType: RoomEvent, callback: (data?: any) => void) {
    eventCenter.off(eventType, callback);
  }

  public async start({ roomId, roomType, options }: { roomId: string; roomType?: RoomType; options?: StartOptions }) {
    const { createAndJoinRoom } = useRoomState();
    const {
      openLocalCamera,
      openLocalMicrophone,
      setCurrentCamera,
      setCurrentMicrophone,
      setCurrentSpeaker,
    } = useDeviceState();

    const {
      roomName,
      isOpenCamera = false,
      isOpenMicrophone = false,
      defaultCameraId,
      defaultMicrophoneId,
      defaultSpeakerId,
      password,
    } = options || {};

    const { isJoiningRoom, handleJoinRoomError } = useRoomLifeCycle();
    isJoiningRoom.value = true;
    try {
      await createAndJoinRoom({
        roomId,
        roomType: roomType || RoomType.Standard,
        options: {
          roomName,
          password,
        },
      });
    } catch (error) {
      isJoiningRoom.value = false;
      handleJoinRoomError(error);
      throw error;
    }
    isJoiningRoom.value = false;

    // Set default device before opening
    if (defaultCameraId) {
      await setCurrentCamera({ deviceId: defaultCameraId });
    }
    if (defaultMicrophoneId) {
      await setCurrentMicrophone({ deviceId: defaultMicrophoneId });
    }
    if (defaultSpeakerId) {
      await setCurrentSpeaker({ deviceId: defaultSpeakerId });
    }

    // Open device based on parameters
    if (isOpenCamera) {
      try {
        await openLocalCamera();
      } catch (error) {
        console.warn('Failed to open camera:', error);
      }
    }

    if (isOpenMicrophone) {
      try {
        await openLocalMicrophone();
      } catch (error) {
        console.warn('Failed to open microphone:', error);
      }
    }
  }

  public async join({ roomId, roomType, options }: { roomId: string; roomType?: RoomType; options?: JoinOptions }) {
    const { joinRoom } = useRoomState();
    const {
      openLocalCamera,
      openLocalMicrophone,
      setCurrentCamera,
      setCurrentMicrophone,
      setCurrentSpeaker,
    } = useDeviceState();

    const {
      isOpenCamera = false,
      isOpenMicrophone = false,
      defaultCameraId,
      defaultMicrophoneId,
      defaultSpeakerId,
      password,
    } = options || {};

    // Join existing room with atomicx API
    const { isJoiningRoom, joiningRoomId, handleJoinRoomError }
      = useRoomLifeCycle();
    isJoiningRoom.value = true;
    joiningRoomId.value = roomId;
    try {
      await joinRoom({
        roomId,
        roomType: roomType || RoomType.Standard,
        password,
      });
    } catch (error) {
      isJoiningRoom.value = false;
      handleJoinRoomError(error);
      return;
    }
    isJoiningRoom.value = false;
    joiningRoomId.value = '';
    // Set default device before opening
    if (defaultCameraId) {
      await setCurrentCamera({ deviceId: defaultCameraId });
    }
    if (defaultMicrophoneId) {
      await setCurrentMicrophone({ deviceId: defaultMicrophoneId });
    }
    if (defaultSpeakerId) {
      await setCurrentSpeaker({ deviceId: defaultSpeakerId });
    }

    // Open device based on parameters
    if (isOpenCamera) {
      try {
        await openLocalCamera();
      } catch (error) {
        console.warn('Failed to open camera:', error);
      }
    }

    if (isOpenMicrophone) {
      try {
        await openLocalMicrophone();
      } catch (error) {
        console.warn('Failed to open microphone:', error);
      }
    }
  }

  public async leave() {
    const { leaveRoom } = useRoomState();
    await leaveRoom();
  }

  public async dismiss() {
    const { endRoom } = useRoomState();
    await endRoom();
  }

  public setSelfInfo(options: { userName: string; avatarUrl: string }) {
    const { setSelfInfo } = useLoginState();
    return setSelfInfo(options);
  }

  public setComponentConfig(config: ComponentConfig) {
    const index = this.componentConfig.findIndex(item => item.componentName === config.componentName);
    if (index !== -1) {
      this.componentConfig[index] = config;
    } else {
      this.componentConfig.push(config);
    }
  }

  public getComponentConfig(name: ComponentName) {
    return this.componentConfig.find(item => item.componentName === name);
  }

  public setWidgetVisible(config: Partial<Record<BuiltinWidget, boolean>>) {
    dataReport.reportCount(MetricsKey.T_METRICS_STATE_API_SET_WIDGET_VISIBLE_COUNT);
    Object.entries(config).forEach(([key, value]) => {
      this.widgetVisibility[key] = value;
    });
  }

  public getWidgetVisible(name: BuiltinWidget): boolean {
    return this.widgetVisibility[name] !== false;
  }

  public registerWidget(config: WidgetConfig): () => void {
    dataReport.reportCount(MetricsKey.T_METRICS_STATE_API_REGISTER_WIDGET_COUNT);
    const processed = { ...config } as any;
    const currentInstance = getCurrentInstance();
    const declarationOrderContext = currentInstance ? inject(widgetDeclarationOrderContextKey, null) : null;
    const componentType = currentInstance?.type as { name?: string; __name?: string } | undefined;
    processed.__declarationOrder = declarationOrderContext?.getDeclarationOrder(componentType?.name || componentType?.__name);
    if (processed.component) {
      processed.component = markRaw(processed.component);
    }
    if (processed.panel?.component) {
      processed.panel = { ...processed.panel, component: markRaw(processed.panel.component) };
    }
    config = processed as WidgetConfig;
    const existingIndex = this.registeredWidgets.findIndex(w => w.id === config.id);
    if (existingIndex !== -1) {
      processed.__registrationIndex = (this.registeredWidgets[existingIndex] as any).__registrationIndex;
      this.registeredWidgets.splice(existingIndex, 1, config);
    } else if (config.order !== undefined && config.order >= 0) {
      processed.__registrationIndex = this.widgetRegistrationIndex;
      this.widgetRegistrationIndex += 1;
      const targetZone = config.zone;
      let zoneCount = 0;
      let globalPos = this.registeredWidgets.length;
      let lastZonePos = -1;
      for (let i = 0; i < this.registeredWidgets.length; i++) {
        const w = this.registeredWidgets[i];
        const isSameZone = this.isZoneOverlap(w.zone, targetZone);
        if (isSameZone) {
          if (zoneCount === config.order) {
            globalPos = i;
            break;
          }
          zoneCount++;
          lastZonePos = i;
        }
      }
      if (zoneCount < config.order && zoneCount > 0) {
        globalPos = lastZonePos + 1;
      }
      this.registeredWidgets.splice(globalPos, 0, config);
    } else {
      processed.__registrationIndex = this.widgetRegistrationIndex;
      this.widgetRegistrationIndex += 1;
      this.registeredWidgets.push(config);
    }
    return () => {
      const index = this.registeredWidgets.findIndex(w => w.id === config.id);
      if (index !== -1) {
        this.registeredWidgets.splice(index, 1);
      }
    };
  }

  private isZoneOverlap(
    zoneA: WidgetZoneConfig | undefined,
    zoneB: WidgetZoneConfig | undefined,
  ): boolean {
    if (zoneA === undefined || zoneB === undefined) return false;
    const zonesA = this.getZoneValues(zoneA);
    const zonesB = this.getZoneValues(zoneB);
    return zonesA.some(z => zonesB.includes(z));
  }

  private getZoneValues(zoneConfig: WidgetZoneConfig): WidgetZone[] {
    if (typeof zoneConfig === 'string') return [zoneConfig];
    const zones: WidgetZone[] = [];
    if (zoneConfig.pc) zones.push(zoneConfig.pc);
    if (zoneConfig.h5) zones.push(zoneConfig.h5);
    return zones;
  }

  private resolveZone(zoneConfig: WidgetZoneConfig | undefined, platform?: WidgetPlatform): WidgetZone | undefined {
    if (zoneConfig === undefined) {
      return undefined;
    }
    if (typeof zoneConfig === 'string') {
      return zoneConfig;
    }
    if (platform) {
      return zoneConfig[platform];
    }
    return zoneConfig.pc ?? zoneConfig.h5;
  }

  public getRegisteredWidgets(zone?: WidgetZone, platform?: WidgetPlatform): WidgetConfig[] {
    const widgets = this.registeredWidgets.filter((w) => {
      const resolved = this.resolveZone(w.zone, platform);
      if (resolved === undefined) {
        return false;
      }
      if (zone) {
        return resolved === zone;
      }
      return true;
    });

    if (!zone) {
      return widgets;
    }

    const getDeclarationOrder = (widget: WidgetConfig) => (widget as any).__declarationOrder ?? Number.MAX_SAFE_INTEGER;
    const getRegistrationIndex = (widget: WidgetConfig) => (widget as any).__registrationIndex ?? Number.MAX_SAFE_INTEGER;

    const unorderedWidgets = [...widgets]
      .filter(widget => widget.order === undefined || widget.order < 0)
      .sort((a, b) => {
        const declarationDiff = getDeclarationOrder(a) - getDeclarationOrder(b);
        if (declarationDiff !== 0) {
          return declarationDiff;
        }
        return getRegistrationIndex(a) - getRegistrationIndex(b);
      });

    const orderedWidgets = [...widgets]
      .filter(widget => widget.order !== undefined && widget.order >= 0)
      .sort((a, b) => {
        const orderDiff = (a.order as number) - (b.order as number);
        if (orderDiff !== 0) {
          return orderDiff;
        }
        const declarationDiff = getDeclarationOrder(a) - getDeclarationOrder(b);
        if (declarationDiff !== 0) {
          return declarationDiff;
        }
        return getRegistrationIndex(a) - getRegistrationIndex(b);
      });

    orderedWidgets.forEach((widget) => {
      const insertIndex = Math.min(widget.order as number, unorderedWidgets.length);
      unorderedWidgets.splice(insertIndex, 0, widget);
    });

    return unorderedWidgets;
  }

  public onWill(action: InterceptorAction, handler: InterceptorHandler): () => void {
    dataReport.reportCount(MetricsKey.T_METRICS_STATE_API_ON_WILL_COUNT);
    if (!this.interceptorHandlers.has(action)) {
      this.interceptorHandlers.set(action, new Set());
    }
    this.interceptorHandlers.get(action)!.add(handler);
    return () => {
      this.interceptorHandlers.get(action)?.delete(handler);
    };
  }

  public async executeInterceptor(action: InterceptorAction, proceed: () => void | Promise<void>, abort?: () => void): Promise<void> {
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
      currentIndex++;
      await handler(action, next, abort || (() => {}));
    };

    await next();
  }

  public setFeatureConfig(config: Partial<FeatureConfig>) {
    dataReport.reportCount(MetricsKey.T_METRICS_STATE_API_SET_FEATURE_CONFIG_COUNT);
    Object.keys(config).forEach((key) => {
      const k = key as keyof FeatureConfig;
      (this.featureConfig as any)[k] = config[k];
    });
  }

  public getFeatureConfig<K extends keyof FeatureConfig>(key: K): FeatureConfig[K] | undefined {
    return this.featureConfig[key];
  }
}

export const conference = new Conference();
