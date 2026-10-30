import './base/theme/index.scss';
// Registers the built-in locale bundles onto the shared i18n table
import './i18n';

// Core API
export { RoomKit, ExitReason, RoomLayoutTemplate, RoomScene, genTestUserSig } from './core';
export type {
  CreateAndJoinOptions,
  Credentials,
  ExitedPayload,
  GenTestUserSigParams,
  GenTestUserSigResult,
  InterceptorAction,
  InterceptorHandler,
  RoomContainer,
  RoomKitEventMap,
  RoomKitJoinOptions,
} from './core';

// Scene views
export { ConferenceView } from './views/conference';

// i18n
export { i18n, t, useI18n } from './base';
export type { Language } from './base';

// UI config and base components
export {
  RoomKitProvider,
  setUIConfig,
  useUIConfig,
  TUIActionSheet,
  TUIAvatar,
  TUIBadge,
  TUIButton,
  TUICheckbox,
  TUIDatePicker,
  TUIDialog,
  TUIDropdown,
  TUIDropdownItem,
  TUIDropdownSeparator,
  TUIIcon,
  TUIInput,
  TUIList,
  TUIListItem,
  TUILoading,
  TUIMessageBox,
  TUIOption,
  TUIPopover,
  TUIPopup,
  TUISelect,
  TUISlider,
  TUISwiper,
  TUISwiperItem,
  TUISwitch,
  TUIToast,
  TUITooltip,
  TUIWatermark,
} from './base';
export type {
  ActionSheetAction,
  ContactListProvider,
  RoomKitContact,
  ShareLink,
  SwiperChangeSource,
  SwiperDirection,
  ThemeName,
  ThemeOptions,
  UIConfig,
  UILanguage,
} from './base';

// Icons: named components plus the override types used by setUIConfig({ icons })
export * from './base/icons/named';
export type { IconName, IconOverrides } from './base/icons/names';

// Features for pre-conference assembly
export {
  AudioDeviceMenu,
  checkInsecureContext,
  LanguageButton,
  MeetingDetailMobile,
  MicLevelIcon,
  ScheduledListMobile,
  ScheduledListPC,
  SchedulePanel,
  SettingsDialogPC,
  ThemeButton,
  useDeviceFault,
  useResolvedContacts,
  UserPickerPC,
  VideoDeviceMenu,
} from './features';
export type {
  PickedContact,
  PickerContact,
  ScheduleFailure,
  ScheduleOutcome,
  ScheduleRoomInput,
  SettingsTab,
} from './features';
