/* eslint-disable class-methods-use-this */
import { createApp } from 'vue';
import type { App } from 'vue';
import { KickedOutOfRoomReason } from 'tuikit-atomicx-vue3/room';
import { TUIMessageBox, t } from '../base';
import { ConferenceView } from '../views/conference';
import type { RoomEntryKind } from './session';
import type { RoomEntryFailureReason } from './session/roomEntryError';
import type { RoomContainer } from './types';

/** Session-exit alerts outlive the conference tree. */
const EXIT_NOTICE_TARGET = 'body';

const OVERLAY_RADIUS = '12px';
const OVERLAY_SHADOW = '0 0 0 0.5px color-mix(in srgb, black 24%, transparent), 0 24px 64px -12px color-mix(in srgb, black 45%, transparent)';
const MAX_Z_INDEX = 2147483647;

function isFullSize(value: number | string | undefined): boolean {
  if (value === undefined) {
    return true;
  }
  if (typeof value === 'number') {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '100%' || normalized === '100vw' || normalized === '100vh';
}

function getNextZIndex(): number {
  let highest = 0;
  document.querySelectorAll('*').forEach((element) => {
    const zIndex = Number.parseInt(window.getComputedStyle(element).zIndex, 10);
    if (Number.isFinite(zIndex)) {
      highest = Math.max(highest, zIndex);
    }
  });
  return Math.min(highest + 1, MAX_Z_INDEX);
}

/** Freeze the host page while a fullscreen overlay covers the viewport. */
function lockPageScroll(): () => void {
  const html = document.documentElement;
  const { body } = document;
  const previous = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    htmlOverscroll: html.style.overscrollBehavior,
  };
  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';
  return () => {
    html.style.overflow = previous.htmlOverflow;
    body.style.overflow = previous.bodyOverflow;
    html.style.overscrollBehavior = previous.htmlOverscroll;
  };
}

function toCssSize(value: number | string | undefined): string {
  return typeof value === 'number' ? `${value}px` : value ?? '100%';
}

function createHostElement(container: RoomContainer): HTMLElement {
  const host = document.createElement('div');
  host.setAttribute('data-roomkit-host', '');
  host.style.cssText = 'position:relative;overflow:hidden;box-sizing:border-box;';
  host.style.width = toCssSize(container.width);
  host.style.height = toCssSize(container.height);
  return host;
}

/** Mounting the host on `body` turns it into a viewport overlay. */
function applyOverlayStyle(host: HTMLElement, isFullscreen: boolean): void {
  const { style } = host;
  host.setAttribute('data-roomkit-overlay', '');
  style.position = 'fixed';
  style.inset = '0';
  style.margin = 'auto';
  style.zIndex = String(getNextZIndex());
  // Keep wheel/touch overscroll from chaining to the host page.
  style.overscrollBehavior = 'contain';
  if (!isFullscreen) {
    style.borderRadius = OVERLAY_RADIUS;
    style.boxShadow = OVERLAY_SHADOW;
  }
}

export interface MountOptions {
  mountTarget: HTMLElement;
  container: RoomContainer;
  roomName: string;
}

export class RoomKitMount {
  private hostElement?: HTMLElement;
  private app?: App;
  private restorePageScroll?: () => void;

  get isMounted(): boolean {
    return this.app !== undefined;
  }

  mount({ mountTarget, container, roomName }: MountOptions): void {
    this.unmount();

    const host = createHostElement(container);
    if (mountTarget === document.body) {
      const isFullscreen = isFullSize(container.width) && isFullSize(container.height);
      applyOverlayStyle(host, isFullscreen);
      mountTarget.appendChild(host);
      if (isFullscreen) {
        this.restorePageScroll = lockPageScroll();
      }
    } else {
      mountTarget.appendChild(host);
    }
    this.hostElement = host;

    try {
      this.app = createApp(ConferenceView, { roomName });
      this.app.mount(host);
    } catch (error) {
      this.unmount();
      throw error;
    }
  }

  unmount(): void {
    try {
      this.app?.unmount();
    } finally {
      this.app = undefined;
      this.hostElement?.remove();
      this.hostElement = undefined;
      this.restorePageScroll?.();
      this.restorePageScroll = undefined;
    }
  }

  notifyEnterFailed(kind: RoomEntryKind, reason: RoomEntryFailureReason): void {
    TUIMessageBox.alert({
      title: t(kind === 'create' ? 'RoomEntry.CreateFailed' : 'RoomEntry.JoinFailed'),
      message: t(`RoomEntry.Failure.${reason}`),
      closable: false,
      appendTo: EXIT_NOTICE_TARGET,
    });
  }

  notifyKickedOut(reason: KickedOutOfRoomReason): void {
    let notice = t('RoomNotifications.DefaultKickedOut');
    switch (reason) {
      case KickedOutOfRoomReason.KickedByAdmin:
        notice = t('RoomNotifications.KickedByAdmin');
        break;
      case KickedOutOfRoomReason.ReplacedByAnotherDevice:
        notice = t('RoomNotifications.ReplacedByAnotherDevice');
        break;
      case KickedOutOfRoomReason.KickedByServer:
        notice = t('RoomNotifications.KickedByServer');
        break;
      case KickedOutOfRoomReason.ConnectionTimeout:
        notice = t('RoomNotifications.ConnectionTimeout');
        break;
      case KickedOutOfRoomReason.InvalidStatusOnReconnect:
        notice = t('RoomNotifications.InvalidStatusOnReconnect');
        break;
      case KickedOutOfRoomReason.RoomLimitExceeded:
        notice = t('RoomNotifications.RoomLimitExceeded');
        break;
      default:
        break;
    }
    TUIMessageBox.alert({
      title: t('Room.Notify'),
      message: notice,
      closable: false,
      appendTo: EXIT_NOTICE_TARGET,
    });
  }

  notifyRoomEnded(): void {
    TUIMessageBox.alert({
      title: t('Room.Notify'),
      message: t('Room.RoomEnded'),
      closable: false,
      appendTo: EXIT_NOTICE_TARGET,
    });
  }
}

/** Resolve the selector already checked by the public API parameter decorator. */
export function resolveMountTarget(appendTo: string | HTMLElement): HTMLElement {
  return typeof appendTo === 'string'
    ? document.querySelector(appendTo) as HTMLElement
    : appendTo;
}
