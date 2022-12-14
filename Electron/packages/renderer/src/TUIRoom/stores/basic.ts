import { defineStore } from 'pinia';
import { SpeechMode } from '../constants/room';
import { getLanguage } from '../utils/common';
import { LAYOUT } from '../constants/render';

type SideBarType = 'chat' | 'invite' | 'manage-member' | 'more' | '';

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
  sidebarName: SideBarType,
  masterUserId: string,
  localQuality: number,
  // statistics: TRTCStatistics,
  lang: string,
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
    layout: LAYOUT.NINE_EQUAL_POINTS,
    showSettingDialog: false,
    showApplyUserList: false,
    activeSettingTab: 'audio',
    isLocalStreamMirror: true,
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
    setBasicInfo(infoObj: any) {
      const { sdkAppId, userId, userSig, userName, avatarUrl, roomId } = infoObj;
      sdkAppId && this.setSdkAppId(sdkAppId);
      userId && this.setUserId(userId);
      userSig && this.setUserSig(userSig);
      userName && this.setUserName(userName);
      avatarUrl && this.setAvatarUrl(avatarUrl);
      roomId && this.setRoomId(roomId);
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
    reset() {
      this.isSidebarOpen = false;
      this.layout = LAYOUT.NINE_EQUAL_POINTS;
      this.showSettingDialog = false;
      this.activeSettingTab = 'audio';
      this.isLocalStreamMirror = true;
      this.sidebarName = '';
      this.masterUserId = '';
      this.localQuality = 0;
    },
  },
});
