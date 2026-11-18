/* eslint-disable class-methods-use-this */
import { createApp } from 'vue';
import type { App, Component } from 'vue';
import { KickedOutOfRoomReason } from 'tuikit-atomicx-vue3/room';
import { TUIMessageBox, i18n } from '../base';
import type { RoomEntryKind } from './session';
import { RoomScene } from './types';
import type { RoomContainer } from './types';

/** Session-exit alerts outlive the conference tree. */
const EXIT_NOTICE_TARGET = 'body';

const OVERLAY_RADIUS = '12px';
const OVERLAY_SHADOW = '0 0 0 0.5px color-mix(in srgb, black 24%, transparent), 0 24px 64px -12px color-mix(in srgb, black 45%, transparent)';
const MAX_Z_INDEX = 2147483647;

/**
 * i18n key of the notice for each kick reason. A scene rewords these in its i18n
 * namespace, so core never needs to know which scenes exist.
 */
const KICKED_OUT_NOTICE_KEYS: Partial<Record<KickedOutOfRoomReason, string>> = {
  [KickedOutOfRoomReason.KickedByAdmin]: 'RoomNotifications.KickedByAdmin',
  [KickedOutOfRoomReason.ReplacedByAnotherDevice]: 'RoomNotifications.ReplacedByAnotherDevice',
  [KickedOutOfRoomReason.KickedByServer]: 'RoomNotifications.KickedByServer',
  [KickedOutOfRoomReason.ConnectionTimeout]: 'RoomNotifications.ConnectionTimeout',
  [KickedOutOfRoomReason.InvalidStatusOnReconnect]: 'RoomNotifications.InvalidStatusOnReconnect',
  [KickedOutOfRoomReason.RoomLimitExceeded]: 'RoomNotifications.RoomLimitExceeded',
};
const DEFAULT_KICKED_OUT_NOTICE_KEY = 'RoomNotifications.DefaultKickedOut';

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

/** The view each scene mounts. */
export type SceneViews = Record<RoomScene, Component>;

let sceneViews: SceneViews | undefined;

/**
 * Called once by the package entry. The views layer decides which component each
 * scene renders, so core never imports views.
 */
export function registerSceneViews(views: SceneViews): void {
  sceneViews = views;
}

function getSceneView(scene: RoomScene): Component {
  if (!sceneViews) {
    throw new Error('[RoomKit] Scene views are not registered. Import RoomKit from the package entry, not from a core module.');
  }
  return sceneViews[scene];
}

export interface MountOptions {
  mountTarget: HTMLElement;
  container: RoomContainer;
  roomName: string;
  scene?: RoomScene;
}

export class RoomKitMount {
  private hostElement?: HTMLElement;
  private app?: App;
  private restorePageScroll?: () => void;
  /** Outlives unmount: exit notices are raised as the view tears down and stay open after it. */
  private scene = RoomScene.Conference;

  get isMounted(): boolean {
    return this.app !== undefined;
  }

  mount({ mountTarget, container, roomName, scene = RoomScene.Conference }: MountOptions): void {
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

    this.scene = scene;

    try {
      this.app = createApp(getSceneView(scene), { roomName });
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

  /** Notices are raised while the view tears down, so they read the scene namespace directly. */
  private get t() {
    return i18n.getFixedT(null, this.scene);
  }

  notifyEnterFailed(kind: RoomEntryKind, messageKey: string): void {
    TUIMessageBox.alert({
      title: this.t(kind === 'create' ? 'RoomEntry.CreateFailed' : 'RoomEntry.JoinFailed'),
      message: this.t(messageKey),
      closable: false,
      appendTo: EXIT_NOTICE_TARGET,
    });
  }

  notifyKickedOut(reason: KickedOutOfRoomReason): void {
    this.alertNotice(KICKED_OUT_NOTICE_KEYS[reason] ?? DEFAULT_KICKED_OUT_NOTICE_KEY);
  }

  notifyRoomEnded(): void {
    this.alertNotice('Room.RoomEnded');
  }

  private alertNotice(messageKey: string): void {
    TUIMessageBox.alert({
      title: this.t('Room.Notify'),
      message: this.t(messageKey),
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
