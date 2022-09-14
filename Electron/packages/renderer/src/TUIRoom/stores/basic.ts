import { defineStore } from 'pinia';
import { ETUISpeechMode, ETUIRoomRole, TRTCStatistics, TRTCVideoStreamType } from '../tui-room-core';
import { getLanguage } from '../utils/common';
import { LAYOUT } from '../constants/render';

type SideBarType = 'chat' | 'invite' | 'manage-member' | 'more' | '';

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
  showApplyUserList: boolean,
  activeSettingTab: string,
  layout: LAYOUT,
  isLocalStreamMirror: boolean,
  sidebarName: SideBarType,
  role: ETUIRoomRole | null,
  masterUserId: string,
  localQuality: number,
  statistics: TRTCStatistics,
  isMuteAllAudio: boolean,
  isMuteAllVideo: boolean,
  canControlSelfAudio: boolean,
  canControlSelfVideo: boolean,
  lang: string,
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
    showApplyUserList: false,
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
    isMuteAllAudio: false,
    isMuteAllVideo: false,
    // 主持人全员禁麦，但是单独取消某个用户音视频禁止状态的时候，是可以自己 unmute audio/video 的
    canControlSelfAudio: true,
    canControlSelfVideo: true,
    lang: getLanguage(),
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
    isMaster(state) {
      return state.role === ETUIRoomRole.MASTER;
    },
    isAnchor(state) {
      return state.role === ETUIRoomRole.ANCHOR;
    },
    isAudience(state) {
      return state.role === ETUIRoomRole.AUDIENCE;
    },
    isLocalAudioIconDisable(state) {
      // 全员禁麦状态
      const micForbidden = state.userId !== state.masterUserId && !state.canControlSelfAudio;
      // 举手发言麦下模式
      const audienceRole = state.roomMode === ETUISpeechMode.APPLY_SPEECH && state.role === ETUIRoomRole.AUDIENCE;
      return micForbidden || audienceRole;
    },
    isLocalVideoIconDisable(state) {
      // 全员禁画状态
      const cameraForbidden = state.userId !== state.masterUserId && !state.canControlSelfVideo;
      // 举手发言麦下模式
      const audienceRole = state.roomMode === ETUISpeechMode.APPLY_SPEECH && state.role === ETUIRoomRole.AUDIENCE;
      return cameraForbidden || audienceRole;
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
    setRoomInfo(roomInfo: {
      ownerId: string,
      roomConfig: {
        isAllMicMuted: boolean,
        isAllCameraMuted: boolean,
        speechMode: ETUISpeechMode
      }
    }) {
      const { ownerId, roomConfig: { isAllMicMuted, isAllCameraMuted, speechMode } } = roomInfo;
      this.masterUserId = ownerId;
      if (this.userId === ownerId) {
        this.role = ETUIRoomRole.MASTER;
      } else {
        this.role = speechMode === ETUISpeechMode.APPLY_SPEECH ? ETUIRoomRole.AUDIENCE : ETUIRoomRole.ANCHOR;
      }
      this.isMuteAllAudio = isAllMicMuted;
      this.isMuteAllVideo = isAllCameraMuted;
      if (this.isMuteAllAudio) {
        this.canControlSelfAudio = false;
      }
      if (this.isMuteAllVideo) {
        this.canControlSelfVideo = false;
      }
      this.roomMode = speechMode;
    },
    setLocalQuality(quality: number) {
      this.localQuality = quality;
    },
    setStatistics(statistics: TRTCStatistics) {
      this.statistics = statistics;
    },
    setIsMuteAllAudio(isMuteAllAudio: boolean) {
      this.isMuteAllAudio = isMuteAllAudio;
    },
    setIsMuteAllVideo(isMuteAllVideo: boolean) {
      this.isMuteAllVideo = isMuteAllVideo;
    },
    setCanControlSelfAudio(capability: boolean) {
      this.canControlSelfAudio = capability;
    },
    setCanControlSelfVideo(capability: boolean) {
      this.canControlSelfVideo = capability;
    },
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
      this.isMuteAllAudio = false;
      this.isMuteAllVideo = false;
    },
  },
});
