import { defineStore } from 'pinia';
import { ETUISpeechMode, ETUIRoomRole, TRTCStatistics, TRTCVideoStreamType } from '../tui-room-core';
import { LAYOUT } from '../constants/render';

interface BasicState {
  sdkAppId: number,
  userId: string,
  userSig: string,
  shareUserId: string,
  shareUserSig?: string,
  userName: string,
  userAvatar?: string,
  useStringRoomId: boolean,
  roomId: number,
  roomMode: ETUISpeechMode,
  isSidebarOpen: boolean,
  showSettingDialog: boolean,
  activeSettingTab: string,
  layout: LAYOUT,
  isLocalStreamMirror: boolean,
  sidebarName: 'chat' | 'invite' | '',
  role: ETUIRoomRole | null,
  masterUserId: string,
  localQuality: number,
  statistics: TRTCStatistics,
}

export const useBasicStore = defineStore('basic', {
  state: (): BasicState => ({
    sdkAppId: 0,
    userId: '',
    userSig: '',
    shareUserId: '',
    shareUserSig: '',
    userName: '',
    userAvatar: '',
    useStringRoomId: false,
    roomId: 0,
    roomMode: ETUISpeechMode.FREE_SPEECH,
    isSidebarOpen: false,
    layout: LAYOUT.NINE_EQUAL_POINTS,
    showSettingDialog: false,
    activeSettingTab: 'audio',
    isLocalStreamMirror: true,
    sidebarName: '',
    role: null,
    masterUserId: '',
    localQuality: 0,
    statistics: {
      appCpu: 0,
      downLoss: 0,
      localStatisticsArray: [],
      localStatisticsArraySize: 0,
      receivedBytes: 0,
      remoteStatisticsArray: [],
      remoteStatisticsArraySize: 0,
      rtt: 0,
      sentBytes: 0,
      systemCpu: 0,
      upLoss: 0,
    },
  }),
  getters: {
    localVideoBitrate: (state) => {
      const localStatistics = state.statistics.localStatisticsArray
        .find(item => item.streamType === TRTCVideoStreamType.TRTCVideoStreamTypeBig);
      if (localStatistics && localStatistics.videoBitrate)  {
        return localStatistics.videoBitrate;
      }
      return 0;
    },
    localFrameRate: (state) => {
      const localStatistics = state.statistics.localStatisticsArray
        .find(item => item.streamType === TRTCVideoStreamType.TRTCVideoStreamTypeBig);
      if (localStatistics && localStatistics.frameRate)  {
        return localStatistics.frameRate;
      }
      return 0;
    },
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
    setShareUserId(shareUserId: string) {
      this.shareUserId = shareUserId;
    },
    setShareUserSig(shareUserSig: string) {
      this.shareUserSig = shareUserSig;
    },
    setUserName(userName: string) {
      this.userName = userName;
    },
    setUserAvatar(userAvatar: string) {
      this.userAvatar = userAvatar;
    },
    setRoomId(roomId: number) {
      this.roomId = roomId;
      this.useStringRoomId = typeof roomId === 'string';
    },
    setRoomMode(mode: ETUISpeechMode) {
      this.roomMode = mode;
    },
    setSidebarOpenStatus(isOpen: boolean) {
      this.isSidebarOpen = isOpen;
    },
    setSidebarName(name: 'chat' | 'invite' | '') {
      this.sidebarName = name;
    },
    setLayout(layout: LAYOUT) {
      this.layout = layout;
    },
    setShowSettingDialog(show: boolean) {
      this.showSettingDialog = show;
    },
    setActiveSettingTab(tabName: string) {
      this.activeSettingTab = tabName;
    },
    setIsLocalStreamMirror(mirror: boolean) {
      this.isLocalStreamMirror = mirror;
    },
    setBasicInfo(infoObj: any) {
      const { sdkAppId, userId, userSig, shareUserId, shareUserSig, userName, userAvatar, roomId } = infoObj;
      sdkAppId && this.setSdkAppId(sdkAppId);
      userId && this.setUserId(userId);
      userSig && this.setUserSig(userSig);
      shareUserId && this.setShareUserId(shareUserId);
      shareUserSig && this.setShareUserSig(shareUserSig);
      userName && this.setUserName(userName);
      userAvatar && this.setUserAvatar(userAvatar);
      roomId && this.setRoomId(roomId);
    },
    setRole(role: ETUIRoomRole) {
      this.role = role;
    },
    setMasterUserId(userId: string) {
      this.masterUserId = userId;
    },
    setLocalQuality(quality: number) {
      this.localQuality = quality;
    },
    setStatistics(statistics: TRTCStatistics) {
      this.statistics = statistics;
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
