import { markRaw, reactive } from 'vue';
import type { Component } from 'vue';
import { i18n } from './i18n';
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

/** Built-in controls whose visibility `widgetVisible` can turn off in the conference and education scenes; names match the previous RoomKit package. */
export enum RoomWidget {
  MicWidget = 'MicWidget',
  CameraWidget = 'CameraWidget',
  ScreenShareWidget = 'ScreenShareWidget',
  WhiteboardWidget = 'WhiteboardWidget',
  AnnotationWidget = 'AnnotationWidget',
  RoomChatWidget = 'RoomChatWidget',
  MemberWidget = 'MemberWidget',
  RecordingWidget = 'RecordingWidget',
  AIToolsWidget = 'AIToolsWidget',
  SettingsWidget = 'SettingsWidget',
  LeaveRoomWidget = 'LeaveRoomWidget',
}

export type WidgetVisible = Partial<Record<RoomWidget, boolean>>;

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
  participantViewUI?: Component;
  /** Invitation link shown in room info. An empty string hides it; `undefined` restores the page URL. */
  shareLink?: ShareLink;
  /** Replaces the IM friend list in invite and schedule pickers; `undefined` restores the friend list. */
  contactList?: ContactListProvider;
  /**
   * `false` hides a built-in control; calls merge, and `undefined` shows every control again.
   * `true` only lifts this hiding: a control still follows its own rules, such as role checks.
   * Hiding `LeaveRoomWidget` leaves exiting to the host page.
   * The education scene has no `WhiteboardWidget`, `RecordingWidget` or `AIToolsWidget` control,
   * and on mobile no `ScreenShareWidget`, `MemberWidget` or `SettingsWidget` control, so those keys do nothing there.
   */
  widgetVisible?: WidgetVisible;
}

export interface ResolvedUIConfig {
  theme: ThemeName;
  colors: Partial<Record<ThemeName, ThemeColors>>;
  fontFamily?: string;
  icons: IconOverrides;
  participantViewUI?: Component;
  shareLink?: ShareLink;
  contactList?: ContactListProvider;
  widgetVisible: WidgetVisible;
}

export const uiConfig: ResolvedUIConfig = reactive({
  theme: 'light',
  colors: {},
  icons: {} as IconOverrides,
  widgetVisible: {},
});

function applyThemeName(theme: ThemeName): void {
  uiConfig.theme = theme;
}

function applyThemeOptions({ themeStyle, ...colors }: ThemeOptions): void {
  const target = themeStyle ?? uiConfig.theme;
  const defined = Object.fromEntries(Object.entries(colors).filter(([, value]) => value !== undefined));
  uiConfig.colors[target] = { ...uiConfig.colors[target], ...defined };
  if (themeStyle !== undefined) {
    applyThemeName(themeStyle);
  }
}

export function setUIConfig(options: UIConfig): void {
  const { theme } = options;
  if (typeof theme === 'string') {
    applyThemeName(theme);
  } else if (theme !== undefined) {
    applyThemeOptions(theme);
  }
  if (options.fontFamily !== undefined) {
    uiConfig.fontFamily = options.fontFamily;
  }
  if (options.language !== undefined) {
    i18n.changeLanguage(options.language);
  }
  if (options.icons !== undefined) {
    uiConfig.icons = { ...uiConfig.icons, ...options.icons };
  }
  if ('participantViewUI' in options) {
    const { participantViewUI } = options;
    uiConfig.participantViewUI = participantViewUI ? markRaw(participantViewUI) : undefined;
  }
  if ('shareLink' in options) {
    uiConfig.shareLink = options.shareLink;
  }
  if ('contactList' in options) {
    uiConfig.contactList = options.contactList;
  }
  if ('widgetVisible' in options) {
    uiConfig.widgetVisible = options.widgetVisible ? { ...uiConfig.widgetVisible, ...options.widgetVisible } : {};
  }
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
  return { uiConfig, setUIConfig };
}
