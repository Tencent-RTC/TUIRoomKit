import { TUIUserInfo } from '@tencentcloud/tuiroom-engine-js';
import { TUIRole } from 'tuikit-atomicx-vue3/room';

export enum BarrageType {
  text = 0,
  custom = 1,
}

export enum BarrageEvent {
  onBarrageReceived = 'onBarrageReceived',
  onCustomMessageReceived = 'onCustomMessageReceived',
}

export type OnWillSendBarrage = (message: Barrage) => void | boolean | Promise<boolean>;

export type OnDidSendBarrage = (message: Barrage) => void;

type BarrageEventMap = {
  [BarrageEvent.onBarrageReceived]: Barrage;
  [BarrageEvent.onCustomMessageReceived]: Barrage;
};

export type BarrageEventCallback<T extends BarrageEvent> = (eventInfo: BarrageEventMap[T]) => void;

interface BaseMessageInfo {
  roomId: string;
  sender: TUIUserInfo;
  sequence: number;
  timestampInSecond: number;
}

export interface Barrage extends BaseMessageInfo {
  messageType: BarrageType;
  textContent?: string;
  extensionInfo?: Record<string, string> | null;
  businessId?: string;
  data?: string;
}

export type BarrageSender = {
  userId: string;
  userName: string;
  nameCard: string;
  avatarUrl: string;
  userRole: TUIRole;
  level: number;
  hasAudioStream: boolean;
  hasVideoStream: boolean;
  hasScreenStream: boolean;
  isMessageDisabled: boolean;
  roomCustomInfo: Record<string, any>;
};

export interface MessageItemSlotProps {
  message: Barrage;
  sender: BarrageSender;
}
