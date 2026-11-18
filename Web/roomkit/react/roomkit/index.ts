import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
// Host-style isolation; must precede the theme so its `.rk-root *` rules win.
import './base/theme/reset.scss';
import './base/theme/index.scss';
// Registers the built-in locale bundles onto the shared i18n table
import './i18n';
import { registerSceneViews } from './core/mount';
import { SCENE_VIEWS } from './views';

// Core mounts whatever the views layer registers here, so core never imports views.
registerSceneViews(SCENE_VIEWS);

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
  MediaPreference,
  ParticipantViewUIProps,
  RoomContainer,
  RoomKitEventMap,
  RoomKitJoinOptions,
} from './core';

// Scene views
export { ConferenceView } from './views/conference';
export { EDUCATION_VIRTUAL_BACKGROUND_IMG_LIST } from './views/education/virtualBackgroundImgList';

// i18n
export { i18n, t, useI18n } from './i18n';
export type { Language } from './i18n';

// UI config and base components
export {
  RoomKitProvider,
  RoomWidget,
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
  TUISegmented,
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
  ParticipantViewUIComponent,
  RoomKitContact,
  ShareLink,
  SwiperChangeSource,
  SwiperDirection,
  ThemeName,
  ThemeOptions,
  UIConfig,
  UILanguage,
  WidgetVisible,
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

TUIRoomEngine.once('ready', () => {
  TUIRoomEngine.callExperimentalAPI(
    JSON.stringify({
      api: 'setFramework',
      params: {
        component: 'TUIRoomKit',
        language: 'react',
      },
    }),
  );
});
