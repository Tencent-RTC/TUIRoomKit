import AIToolsButton from './AIToolsButton/index.vue';
import AIToolsButtonH5 from './AIToolsButtonH5/index.vue';
import BasicBeautyButton from './BasicBeautyButton/index.vue';
import CallButton from './CallButton/index.vue';
import CallButtonH5 from './CallButtonH5/index.vue';
import CameraButton from './CameraButton/index.vue';
import CameraButtonH5 from './CameraButtonH5/index.vue';
import CurrentRoomInfo from './CurrentRoomInfo/index.vue';
import ExpandFooterH5 from './ExpandFooterH5/index.vue';
import JoinRoomButton from './JoinRoomButton/index.vue';
import JoinRoomButtonH5 from './JoinRoomButtonH5/index.vue';
import LanguageButton from './LanguageButton/index.vue';
import LayoutButton from './LayoutButton/index.vue';
import LeaveRoomButton from './LeaveRoomButton/index.vue';
import LeaveRoomButtonH5 from './LeaveRoomButtonH5/index.vue';
import LoadingOverlay from './LoadingOverlay/index.vue';
import LocalNetworkInfo from './LocalNetworkInfo/index.vue';
import LoginUserInfo from './LoginUserInfo/index.vue';
import LoginUserInfoH5 from './LoginUserInfoH5/index.vue';
import MicButton from './MicButton/index.vue';
import MicButtonH5 from './MicButtonH5/index.vue';
import MoreButton from './MoreButton/index.vue';
import ParticipantButton from './ParticipantButton/index.vue';
import ParticipantButtonH5 from './ParticipantButtonH5/index.vue';
import PasswordDialog from './PasswordDialog/index.vue';
import PasswordDialogH5 from './PasswordDialogH5/index.vue';
import RaiseHandsButton from './RaiseHandsButton/index.vue';
import BarrageButton from './RoomBarrage/BarrageButton.vue';
import RoomBarrage from './RoomBarrage/RoomBarrage.vue';
import ChatButton from './RoomChat/ChatButton.vue';
import RoomChat from './RoomChat/index.vue';
import ChatButtonH5 from './RoomChatH5/ChatButton.vue';
import { showRoomInvitation, hideRoomInvitation } from './RoomInvitation';
import { showRoomInvitationH5, hideRoomInvitationH5 } from './RoomInvitationH5';
import RoomITitleH5 from './RoomITitleH5/index.vue';
import RoomLayoutView from './RoomLayoutView/index.vue';
import RoomLayoutViewH5 from './RoomLayoutViewH5/index.vue';
import RoomSidePanel from './RoomSidePanel/index.vue';
import ScheduledRoomButton from './ScheduledRoomButton/index.vue';
import ScreenShareButton from './ScreenShareButton/index.vue';
import SettingButton from './SettingButton/index.vue';
import SettingButtonH5 from './SettingButtonH5/index.vue';
import StartRoomButton from './StartRoomButton/index.vue';
import StartRoomButtonH5 from './StartRoomButtonH5/index.vue';
import SwitchCameraButtonH5 from './SwitchCameraButtonH5/index.vue';
import ThemeButton from './ThemeButton/index.vue';
import VirtualBackgroundButton from './VirtualBackgroundButton/index.vue';
import RaiseHandsList from './RaiseHandsList/index.vue';
import CustomWidgetRenderer from './CustomWidgetRenderer/index.vue';

// Registrar components (PC)
import ThemeRegistrar from './ThemeButton/ThemeRegistrar.vue';
import LayoutRegistrar from './LayoutButton/LayoutRegistrar.vue';
import LocalNetworkInfoRegistrar from './LocalNetworkInfo/LocalNetworkInfoRegistrar.vue';
import CurrentRoomInfoRegistrar from './CurrentRoomInfo/CurrentRoomInfoRegistrar.vue';
import LanguageRegistrar from './LanguageButton/LanguageRegistrar.vue';
import LoginUserInfoRegistrar from './LoginUserInfo/LoginUserInfoRegistrar.vue';
import MicRegistrar from './MicButton/MicRegistrar.vue';
import CameraRegistrar from './CameraButton/CameraRegistrar.vue';
import ScreenShareRegistrar from './ScreenShareButton/ScreenShareRegistrar.vue';
import InviteRegistrar from './CallButton/InviteRegistrar.vue';
import ChatRegistrar from './RoomChat/ChatRegistrar.vue';
import MemberRegistrar from './ParticipantButton/MemberRegistrar.vue';
import VirtualBackgroundRegistrar from './VirtualBackgroundButton/VirtualBackgroundRegistrar.vue';
import BasicBeautyRegistrar from './BasicBeautyButton/BasicBeautyRegistrar.vue';
import AIToolsRegistrar from './AIToolsButton/AIToolsRegistrar.vue';
import SettingsRegistrar from './SettingButton/SettingsRegistrar.vue';
import LeaveRoomRegistrar from './LeaveRoomButton/LeaveRoomRegistrar.vue';
import BarrageRegistrar from './RoomBarrage/BarrageRegistrar.vue';
import RaiseHandsRegistrar from './RaiseHandsButton/RaiseHandsRegistrar.vue';
import RaiseHandsListRegistrar from './RaiseHandsList/RaiseHandsListRegistrar.vue';

// Registrar components (H5)
import SwitchCameraRegistrarH5 from './SwitchCameraButtonH5/SwitchCameraRegistrarH5.vue';
import CurrentRoomInfoRegistrarH5 from './RoomITitleH5/CurrentRoomInfoRegistrarH5.vue';
import LeaveRoomRegistrarH5 from './LeaveRoomButtonH5/LeaveRoomRegistrarH5.vue';
import MemberRegistrarH5 from './ParticipantButtonH5/MemberRegistrarH5.vue';
import MicRegistrarH5 from './MicButtonH5/MicRegistrarH5.vue';
import CameraRegistrarH5 from './CameraButtonH5/CameraRegistrarH5.vue';
import InviteRegistrarH5 from './CallButtonH5/InviteRegistrarH5.vue';
import ChatRegistrarH5 from './RoomChatH5/ChatRegistrarH5.vue';
import SettingsRegistrarH5 from './SettingButtonH5/SettingsRegistrarH5.vue';
import AIToolsRegistrarH5 from './AIToolsButtonH5/AIToolsRegistrarH5.vue';

export {
  CameraButton,
  CurrentRoomInfo,
  LanguageButton,
  LayoutButton,
  LocalNetworkInfo,
  LoginUserInfo,
  ThemeButton,
  MicButton,
  MoreButton,
  ExpandFooterH5,
  RoomLayoutView,
  RoomLayoutViewH5,
  ScreenShareButton,
  SettingButton,
  CallButton,
  RoomChat,
  ChatButton,
  ParticipantButton,
  VirtualBackgroundButton,
  BasicBeautyButton,
  LoadingOverlay,
  PasswordDialog,
  LeaveRoomButton,
  JoinRoomButton,
  ScheduledRoomButton,
  StartRoomButton,
  RoomSidePanel,
  AIToolsButton,
  showRoomInvitation,
  hideRoomInvitation,
  BarrageButton,
  RoomBarrage,
  RaiseHandsButton,
  RaiseHandsList,
  CustomWidgetRenderer,
  // h5
  MicButtonH5,
  CameraButtonH5,
  RoomITitleH5,
  StartRoomButtonH5,
  LeaveRoomButtonH5,
  JoinRoomButtonH5,
  ParticipantButtonH5,
  ChatButtonH5,
  CallButtonH5,
  SettingButtonH5,
  SwitchCameraButtonH5,
  PasswordDialogH5,
  LoginUserInfoH5,
  AIToolsButtonH5,
  showRoomInvitationH5,
  hideRoomInvitationH5,
  // Registrar components (PC)
  ThemeRegistrar,
  LayoutRegistrar,
  LocalNetworkInfoRegistrar,
  CurrentRoomInfoRegistrar,
  LanguageRegistrar,
  LoginUserInfoRegistrar,
  MicRegistrar,
  CameraRegistrar,
  ScreenShareRegistrar,
  InviteRegistrar,
  ChatRegistrar,
  MemberRegistrar,
  VirtualBackgroundRegistrar,
  BasicBeautyRegistrar,
  AIToolsRegistrar,
  SettingsRegistrar,
  LeaveRoomRegistrar,
  BarrageRegistrar,
  RaiseHandsRegistrar,
  RaiseHandsListRegistrar,
  // Registrar components (H5)
  SwitchCameraRegistrarH5,
  CurrentRoomInfoRegistrarH5,
  LeaveRoomRegistrarH5,
  MemberRegistrarH5,
  MicRegistrarH5,
  CameraRegistrarH5,
  InviteRegistrarH5,
  ChatRegistrarH5,
  SettingsRegistrarH5,
  AIToolsRegistrarH5,
};
