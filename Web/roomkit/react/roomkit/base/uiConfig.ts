import { useSyncExternalStore } from 'react';
import type { ComponentType } from 'react';
import { setLanguage } from './i18n';
import type { IconOverrides } from './icons/names';

export type ThemeName = 'light' | 'dark';

export type UILanguage = 'zh-CN' | 'en-US';

export interface ThemeOptions {
  /** Also the theme the colors below belong to; defaults to the current theme. */
  themeStyle?: ThemeName;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

export type ThemeColors = Pick<ThemeOptions, 'primaryColor' | 'backgroundColor' | 'textColor'>;

export interface RoomKitContact {
  userId: string;
  userName?: string;
  avatarUrl?: string;
}

export type ContactListProvider = () => RoomKitContact[] | Promise<RoomKitContact[]>;

export type ShareLink = string | ((roomId: string) => string);

/**
 * base cannot reference room types, so the props stay loose here; type the component
 * with `ParticipantViewUIProps` from the package root.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParticipantViewUIComponent = ComponentType<any>;

export interface UIConfig {
  /**
   * A theme name, or the theme object accepted by the previous RoomKit package.
   * Colors only apply while their theme is active, so a light palette never leaks into dark mode.
   */
  theme?: ThemeName | ThemeOptions;
  language?: UILanguage;
  fontFamily?: string;
  icons?: IconOverrides;
  /**
   * Replaces the built-in overlay on every participant view; receives `participant` and `streamType` props.
   * Pass `undefined` to restore the built-in overlay.
   * Its root must be transparent and set `pointer-events: none` so the video and on-tile interactions stay usable.
   */
  participantViewUI?: ParticipantViewUIComponent;
  /** Invitation link shown in room info. An empty string hides it; `undefined` restores the page URL. */
  shareLink?: ShareLink;
  /** Replaces the IM friend list in invite and schedule pickers; `undefined` restores the friend list. */
  contactList?: ContactListProvider;
}

export interface ResolvedUIConfig {
  theme: ThemeName;
  colors: Partial<Record<ThemeName, ThemeColors>>;
  fontFamily?: string;
  icons: IconOverrides;
  participantViewUI?: ParticipantViewUIComponent;
  shareLink?: ShareLink;
  contactList?: ContactListProvider;
}

const THEME_STORAGE_KEY = 'tuiRoom-theme';

function readStoredTheme(): ThemeName {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

/** Replaced on every change so subscribers can compare by reference. */
let uiConfig: ResolvedUIConfig = {
  theme: readStoredTheme(),
  colors: {},
  icons: {} as IconOverrides,
};

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getUIConfig(): ResolvedUIConfig {
  return uiConfig;
}

function applyThemeName(next: ResolvedUIConfig, theme: ThemeName): void {
  // `next` is the draft that replaces the store snapshot below.
  // eslint-disable-next-line no-param-reassign
  next.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function applyThemeOptions(next: ResolvedUIConfig, { themeStyle, ...colors }: ThemeOptions): void {
  const target = themeStyle ?? next.theme;
  const defined = Object.fromEntries(Object.entries(colors).filter(([, value]) => value !== undefined));
  // eslint-disable-next-line no-param-reassign
  next.colors = { ...next.colors, [target]: { ...next.colors[target], ...defined } };
  if (themeStyle !== undefined) {
    applyThemeName(next, themeStyle);
  }
}

export function setUIConfig(options: UIConfig): void {
  const next: ResolvedUIConfig = { ...uiConfig };
  const { theme } = options;
  if (typeof theme === 'string') {
    applyThemeName(next, theme);
  } else if (theme !== undefined) {
    applyThemeOptions(next, theme);
  }
  if (options.fontFamily !== undefined) {
    next.fontFamily = options.fontFamily;
  }
  if (options.language !== undefined) {
    setLanguage(options.language);
  }
  if (options.icons !== undefined) {
    next.icons = { ...uiConfig.icons, ...options.icons };
  }
  if ('participantViewUI' in options) {
    next.participantViewUI = options.participantViewUI;
  }
  if ('shareLink' in options) {
    next.shareLink = options.shareLink;
  }
  if ('contactList' in options) {
    next.contactList = options.contactList;
  }
  const changed = (Object.keys(next) as Array<keyof ResolvedUIConfig>)
    .some(key => next[key] !== uiConfig[key]);
  if (!changed) {
    return;
  }
  uiConfig = next;
  listeners.forEach(listener => listener());
}

/** The host-configured invitation link, or `undefined` when the page URL should be used. */
export function resolveShareLink(roomId: string): string | undefined {
  const { shareLink } = uiConfig;
  if (typeof shareLink !== 'function') {
    return shareLink;
  }
  try {
    const link = shareLink(roomId);
    if (typeof link === 'string') {
      return link;
    }
    console.error('[RoomKit.shareLink] The shareLink function must return a string. Falling back to the page URL.');
  } catch (error) {
    console.error('[RoomKit.shareLink] The shareLink function threw. Falling back to the page URL.', error);
  }
  return undefined;
}

/** Host contacts, or `undefined` when no provider is set and the IM friend list should be used. */
export async function loadContactList(): Promise<RoomKitContact[] | undefined> {
  const provider = uiConfig.contactList;
  if (!provider) {
    return undefined;
  }
  try {
    const list = await provider();
    if (!Array.isArray(list)) {
      console.error('[RoomKit.contactList] The contactList function must return an array of contacts.');
      return [];
    }
    return list.filter(item => typeof item?.userId === 'string' && item.userId.trim() !== '');
  } catch (error) {
    console.error('[RoomKit.contactList] The contactList function failed.', error);
    return [];
  }
}

export function useUIConfig() {
  const config = useSyncExternalStore(subscribe, getUIConfig, getUIConfig);
  return { uiConfig: config, setUIConfig };
}
