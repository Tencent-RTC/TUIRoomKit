import { defineStore } from 'pinia';
import { SpeechMode } from '../constants/room';
import { getLanguage } from '../utils/common';
import { LAYOUT } from '../constants/render';
import { isUndefined, isElectronEnv } from '../utils/utils';
import { isWeChat } from '../utils/useMediaValue';

type SideBarType = 'chat' | 'invite' | 'manage-member' | 'more' | 'transfer-leave' | '';

interface BasicState {
  sdkAppId: number,
  userId: string,
  userSig: string,
  userName: string,
  avatarUrl?: string,
  useStringRoomId: boolean,
  roomId: string,
  roomMode: 'FreeSpeech' | 'ApplySpeech',
  isSidebarOpen: boolean,
  showSettingDialog: boolean,
  showApplyUserList: boolean,
  activeSettingTab: string,
  layout: LAYOUT,
  isLocalStreamMirror: boolean,
  isFrontCamera: boolean,
  sidebarName: SideBarType,
  masterUserId: string,
  localQuality: number,
  // statistics: TRTCStatistics,
  lang: string,
  defaultTheme: string,
  isSupportSwitchTheme: boolean,
  showHeaderTool: boolean,
  shareLink: string,
  isRoomLinkVisible: boolean,
  isShowScreenShareAntiFraud: boolean,
  isOpenMic: boolean,
}

export const useBasicStore = defineStore('basic', {
  state: (): BasicState => ({
    sdkAppId: 0,
    userId: '',
    userSig: '',
    userName: '',
    avatarUrl: '',
    useStringRoomId: false,
    roomId: '',
    roomMode: 'FreeSpeech',
    isSidebarOpen: false,
    layout: isWeChat ? LAYOUT.SIX_EQUAL_POINTS :  LAYOUT.NINE_EQUAL_POINTS,
    showSettingDialog: false,
    showApplyUserList: false,
    activeSettingTab: 'audio',
    isLocalStreamMirror: true,
    isFrontCamera: true,
    sidebarName: '',
    masterUserId: '',
    localQuality: 0,
    // statistics: {
    //   appCpu: 0,
    //   downLoss: 0,
    //   localStatisticsArray: [],
    //   localStatisticsArraySize: 0,
    //   receivedBytes: 0,
    //   remoteStatisticsArray: [],
    //   remoteStatisticsArraySize: 0,
    //   rtt: 0,
    //   sentBytes: 0,
    //   systemCpu: 0,
    //   upLoss: 0,
    // },
    lang: getLanguage(),
    defaultTheme: 'black',
    isSupportSwitchTheme: true,
    showHeaderTool: true,
    shareLink: '',
    isRoomLinkVisible: !isElectronEnv() && !isWeChat,
    isShowScreenShareAntiFraud: false,
    isOpenMic: false,
  }),
  getters: {
    // localVideoBitrate: (state) => {
    //   const localStatistics = state.statistics.localStatisticsArray
    //     .find(item => item.streamType === TRTCVideoStreamType.TRTCVideoStreamTypeBig);
    //   if (localStatistics && localStatistics.videoBitrate)  {
    //     return localStatistics.videoBitrate;
    //   }
    //   return 0;
    // },
    // localFrameRate: (state) => {
    //   const localStatistics = state.statistics.localStatisticsArray
    //     .find(item => item.streamType === TRTCVideoStreamType.TRTCVideoStreamTypeBig);
    //   if (localStatistics && localStatistics.frameRate)  {
    //     return localStatistics.frameRate;
    //   }
    //   return 0;
    // },
  },
  actions: {
    setSdkAppId(sdkAppId: number) {
      this.sdkAppId = sdkAppId;
    },
    setUserId(userId: string) {
      this.userId = userId;
    },
    setUserSig(userSig: string) {
      this.userSig = userSig;
    },
    setUserName(userName: string) {
      this.userName = userName;
    },
    setAvatarUrl(avatarUrl: string) {
      this.avatarUrl = avatarUrl;
    },
    setRoomId(roomId: string) {
      this.roomId = roomId;
      this.useStringRoomId = typeof roomId === 'string';
    },
    setRoomMode(mode: SpeechMode) {
      this.roomMode = mode;
    },
    setSidebarOpenStatus(isOpen: boolean) {
      this.isSidebarOpen = isOpen;
    },
    setSidebarName(name: SideBarType) {
      this.sidebarName = name;
    },
    setLayout(layout: LAYOUT) {
      this.layout = layout;
    },
    setShowSettingDialog(show: boolean) {
      this.showSettingDialog = show;
    },
    setShowApplyUserList(show: boolean) {
      this.showApplyUserList = show;
    },
    setActiveSettingTab(tabName: string) {
      this.activeSettingTab = tabName;
    },
    setIsLocalStreamMirror(mirror: boolean) {
      this.isLocalStreamMirror = mirror;
    },
    setIsFrontCamera(isFront: boolean) {
      this.isFrontCamera = isFront;
    },
    setDefaultTheme(defaultTheme: string) {
      this.defaultTheme = defaultTheme;
    },
    setIsSupportSwitchTheme(isSupportSwitchTheme: boolean) {
      this.isSupportSwitchTheme = isSupportSwitchTheme;
    },
    setShowHeaderTool(showHeaderTool: boolean) {
      this.showHeaderTool = showHeaderTool;
    },
    setShareLink(shareLink: string) {
      this.shareLink = shareLink;
    },
    setIsRoomLinkVisible(isRoomLinkVisible: boolean) {
      this.isRoomLinkVisible = isRoomLinkVisible;
    },
    setIsShowScreenShareAntiFraud(isShowScreenShareAntiFraud: boolean) {
      this.isShowScreenShareAntiFraud = isShowScreenShareAntiFraud;
    },
    setBasicInfo(infoObj: any) {
      if (!infoObj) {
        return;
      }
      const { sdkAppId, userId, userSig, userName, avatarUrl, roomId, theme, showHeaderTool } = infoObj;
      sdkAppId && this.setSdkAppId(sdkAppId);
      userId && this.setUserId(userId);
      userSig && this.setUserSig(userSig);
      userName && this.setUserName(userName);
      avatarUrl && this.setAvatarUrl(avatarUrl);
      roomId && this.setRoomId(roomId);
      theme && !isUndefined(theme.defaultTheme) && this.setDefaultTheme(theme.defaultTheme);
      theme && !isUndefined(theme.isSupportSwitchTheme) && this.setIsSupportSwitchTheme(theme.isSupportSwitchTheme);
      !isUndefined(showHeaderTool) && this.setShowHeaderTool(showHeaderTool);
    },
    setMasterUserId(userId: string) {
      this.masterUserId = userId;
    },
    setLocalQuality(userNetworkList: any[]) {
      const localUser = userNetworkList.find(item => item.userId === this.userId);
      this.localQuality = localUser.quality;
    },
    // setStatistics(statistics: TRTCStatistics) {
    //   this.statistics = statistics;
    // },
    setLang(lang: string) {
      this.lang = lang;
    },
    setIsOpenMic(isOpen: boolean) {
      this.isOpenMic = isOpen;
    },
    reset() {
      this.isSidebarOpen = false;
      this.layout = isWeChat ? LAYOUT.SIX_EQUAL_POINTS :  LAYOUT.NINE_EQUAL_POINTS;
      this.showSettingDialog = false;
      this.activeSettingTab = 'audio';
      this.isLocalStreamMirror = true;
      this.sidebarName = '';
      this.masterUserId = '';
      this.localQuality = 0;
      this.roomId = '';
      this.useStringRoomId = false;
      this.roomMode = 'FreeSpeech';
      this.showApplyUserList = false;
      this.isFrontCamera = true;
      this.showHeaderTool = true;
      this.shareLink = '';
      this.isOpenMic = false;
    },
  },
});
