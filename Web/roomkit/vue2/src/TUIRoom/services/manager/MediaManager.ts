import TUIRoomEngine, {
  TUIRoomEvents,
  TUIChangeReason,
  TUIVideoStreamType,
  TRTCVideoStreamType,
  TRTCVideoFillMode,
  TRTCVideoMirrorType,
  TRTCVideoRotation,
} from '@tencentcloud/tuiroom-engine-js';
import { IRoomService, EventType } from '../types';
import { isMobile } from '../../utils/environment';
import { MESSAGE_DURATION } from '../../constants/message';
import logger from '../../utils/common/logger';

interface ObserverData {
  userId: string;
  streamType: TUIVideoStreamType;
  isIntersection?: boolean;
}

export class MediaManager {
  private service: IRoomService;

  intersectionObserver: IntersectionObserver | null = null;

  observerDataMap: Map<HTMLElement | string, ObserverData> = new Map();

  observerRoot: HTMLElement | null = null;

  constructor(service: IRoomService) {
    this.service = service;
    this.bindRoomEngineEvents();
  }

  private getRecordStreamType(streamType: TUIVideoStreamType | undefined) {
    if (streamType === TUIVideoStreamType.kCameraStreamLow) {
      return TUIVideoStreamType.kCameraStream;
    }
    return streamType;
  }

  private intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry: IntersectionObserverEntry) => {
      const { isIntersecting, target } = entry;
      const observerData = this.observerDataMap.get(target as HTMLElement);
      if (!observerData) {
        return;
      }
      const { userId, streamType } = observerData;
      const streamInfo = this.service.roomStore.getStreamInfo(
        userId,
        streamType
      );
      if (!streamInfo) {
        return;
      }
      const { playDomList } = streamInfo;
      if (isIntersecting && playDomList?.length) {
        observerData.isIntersection = true;
        this.doStartPlayVideo({ userId, streamType, view: playDomList });
      } else {
        observerData.isIntersection = false;
        const isContinuePlay = streamInfo?.playDomList?.find(
          item => this.observerDataMap.get(item)?.isIntersection
        );
        if (!isContinuePlay) {
          this.doStopPlayVideo({ userId, streamType });
        }
      }
    });
  }

  private initIntersectionObserver() {
    if (
      !this.intersectionObserver ||
      document.getElementById('roomContainer') !== this.observerRoot
    ) {
      const observerRoot = document.getElementById('roomContainer');
      this.intersectionObserver = new IntersectionObserver(
        this.intersectionObserverCallback.bind(this),
        {
          root: observerRoot,
          rootMargin: '0px',
        }
      );
      this.observerDataMap = new Map();
      this.observerRoot = observerRoot;
    }
  }

  public async startPlayVideo(options: {
    userId: string;
    streamType: TUIVideoStreamType;
    view: HTMLElement;
    observerViewInVisible: boolean;
  }) {
    const { userId, streamType, view, observerViewInVisible } = options;
    logger.info(
      'MediaManager.startPlayVideo',
      userId,
      streamType,
      view,
      observerViewInVisible
    );
    const streamInfo = this.service.roomStore.getStreamInfo(userId, streamType);
    if (!streamInfo) {
      return;
    }
    let newPlayDomList = streamInfo!.playDomList?.slice(0) || [];
    newPlayDomList.push(view);
    newPlayDomList = [...new Set(newPlayDomList)];

    if (!observerViewInVisible) {
      this.service.roomStore.updateStreamInfo({
        userId,
        streamType,
        playDomList: newPlayDomList,
      });
      await this.doStartPlayVideo({ userId, streamType, view: newPlayDomList });
      return;
    }

    this.initIntersectionObserver();

    // If the dom playing A stream is no longer playing, cancel the listen and update the playlist.
    streamInfo?.playDomList?.forEach(playDom => {
      if (!newPlayDomList.includes(playDom)) {
        if (
          this.observerDataMap.get(playDom)?.userId === userId &&
          this.getRecordStreamType(
            this.observerDataMap.get(playDom)?.streamType
          ) === this.getRecordStreamType(streamType)
        ) {
          this.observerDataMap.delete(playDom);
          this.intersectionObserver?.unobserve(playDom);
        }
      }
    });
    this.service.roomStore.updateStreamInfo({
      userId,
      streamType,
      playDomList: newPlayDomList,
    });

    this.observerDataMap.set(
      view,
      Object.assign(this.observerDataMap.get(view) || {}, {
        userId,
        streamType,
      })
    );
    this.intersectionObserver?.observe(view);

    // The dom that was playing stream A is going to play stream B.
    // At this point, the dom already exists and will no longer trigger the intersection event,
    // so when you realize it's already visible, you should play it immediately.
    if (this.observerDataMap.get(view)?.isIntersection) {
      await this.doStartPlayVideo({ userId, streamType, view: newPlayDomList });
    }
  }

  public async doStartPlayVideo(options: {
    userId: string;
    streamType: TUIVideoStreamType;
    view: (HTMLElement | string | null)[];
  }) {
    const { userId, streamType, view } = options;
    const viewIdList = view.map(item => {
      if (item instanceof HTMLElement) {
        return item?.id;
      }
      return item;
    });
    this.service.roomStore.updateStreamInfo({
      userId,
      streamType,
      isLoading: true,
    });
    if (
      userId === this.service.basicStore.userId &&
      streamType === TUIVideoStreamType.kCameraStream
    ) {
      this.service.roomEngine.instance?.setLocalVideoView({ view: viewIdList });
    } else {
      this.service.roomEngine.instance?.setRemoteVideoView({
        userId,
        streamType,
        view: viewIdList,
      });
      await this.setVideoRenderParams({ userId, streamType });
      await this.service.roomEngine.instance?.startPlayRemoteVideo({
        userId,
        streamType,
      });
    }
    this.service.roomStore.updateStreamInfo({
      userId,
      streamType,
      isLoading: false,
    });
  }

  private async setVideoRenderParams(options: {
    userId: string;
    streamType: TUIVideoStreamType;
  }) {
    const { userId, streamType } = options;
    if (userId !== this.service.basicStore.userId) {
      const trtcCloud = this.service.roomEngine.instance?.getTRTCCloud();
      const trtcStreamType =
        streamType === TUIVideoStreamType.kScreenStream
          ? TRTCVideoStreamType.TRTCVideoStreamTypeSub
          : TRTCVideoStreamType.TRTCVideoStreamTypeBig;
      let trtcFillMode = TRTCVideoFillMode.TRTCVideoFillMode_Fit;
      if (isMobile && streamType !== TUIVideoStreamType.kScreenStream) {
        trtcFillMode = TRTCVideoFillMode.TRTCVideoFillMode_Fill;
      }
      await trtcCloud?.setRemoteRenderParams(userId, trtcStreamType, {
        mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
        rotation: TRTCVideoRotation.TRTCVideoRotation0,
        fillMode: trtcFillMode,
      });
    }
  }

  // If only one view wants to stop playing, update the viewList, but don't stop the stream.
  // If no view is passed in, the stream is stopped.
  public async stopPlayVideo(options: {
    userId: string;
    streamType: TUIVideoStreamType;
    view: HTMLElement;
  }) {
    const { userId, streamType, view } = options;
    logger.info('MediaManager.stopPlayVideo', userId, streamType, view);
    const streamInfo = this.service.roomStore.getStreamInfo(userId, streamType);
    if (!streamInfo?.playDomList || streamInfo?.playDomList.length === 0) {
      return;
    }

    if (this.observerDataMap.get(view)) {
      this.observerDataMap.delete(view);
      this.intersectionObserver?.unobserve(view);
    }

    const newPlayDomList = streamInfo?.playDomList
      .slice(0)
      .filter(item => item !== view);
    if (newPlayDomList.length > 0) {
      this.service.roomStore.updateStreamInfo({
        userId,
        streamType,
        playDomList: newPlayDomList,
      });
      await this.doStartPlayVideo({
        userId,
        streamType,
        view: newPlayDomList,
      });
    } else {
      this.service.roomStore.updateStreamInfo({
        userId,
        streamType,
        playDomList: [],
      });
      await this.doStopPlayVideo(options);
    }
  }

  public async doStopPlayVideo(options: {
    userId: string;
    streamType: TUIVideoStreamType;
  }) {
    const { userId, streamType } = options;
    this.service.roomStore.updateStreamInfo({
      userId,
      streamType,
      isLoading: false,
    });
    if (
      userId === this.service.basicStore.userId &&
      streamType === TUIVideoStreamType.kCameraStream
    ) {
      this.service.roomEngine.instance?.setLocalVideoView({ view: null });
    } else {
      await this.service.roomEngine.instance?.stopPlayRemoteVideo({
        userId,
        streamType,
      });
    }
  }

  private onUserAudioStateChanged(eventInfo: {
    userId: string;
    hasAudio: boolean;
    reason: TUIChangeReason;
  }) {
    const { userId, hasAudio, reason } = eventInfo;
    if (
      userId === this.service.basicStore.userId &&
      !hasAudio &&
      reason === TUIChangeReason.kChangedByAdmin
    ) {
      this.service.emit(EventType.ROOM_NOTICE_MESSAGE, {
        type: 'warning',
        message: this.service.t('Your microphone has been turned off'),
        duration: MESSAGE_DURATION.NORMAL,
      });
      /**
       * When the host turns on a full ban, the microphone of a single person is turned on
       * and off separately, and the microphone status of the corresponding user is inoperable at this time
       **/
      this.service.roomStore.setCanControlSelfAudio(
        !this.service.roomStore.isMicrophoneDisableForAllUser
      );
    }
  }

  private onUserVideoStateChanged = (eventInfo: {
    userId: string;
    streamType: TUIVideoStreamType;
    hasVideo: boolean;
    reason: TUIChangeReason;
  }) => {
    const { userId, streamType, hasVideo, reason } = eventInfo;

    // Handle status changes
    if (
      userId === this.service.basicStore.userId &&
      !hasVideo &&
      reason === TUIChangeReason.kChangedByAdmin
    ) {
      // The host turns off the camera
      if (streamType === TUIVideoStreamType.kCameraStream) {
        this.service.emit(EventType.ROOM_NOTICE_MESSAGE, {
          type: 'warning',
          message: this.service.t('Your camera has been turned off'),
          duration: MESSAGE_DURATION.NORMAL,
        });
        // When the moderator opens the whole staff forbidden to draw,
        // open and then close the single person's camera alone, at this time
        // the corresponding user's camera status for inoperable
        this.service.roomStore.setCanControlSelfVideo(
          !this.service.roomStore.isCameraDisableForAllUser
        );
      }
      // Host turns off screen sharing
      if (streamType === TUIVideoStreamType.kScreenStream) {
        this.service.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
          title: this.service.t('Your screen sharing has been stopped'),
          message: this.service.t(
            'Your screen sharing has been stopped, Now only the host/admin can share the screen'
          ),
          confirmButtonText: this.service.t('I got it'),
        });
      }
    }
  };

  dispose() {
    this.intersectionObserver = null;
    this.observerDataMap = new Map();
  }

  private bindRoomEngineEvents() {
    TUIRoomEngine.once('ready', () => {
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onUserVideoStateChanged,
        this.onUserVideoStateChanged.bind(this)
      );
      this.service.roomEngine.instance?.on(
        TUIRoomEvents.onUserAudioStateChanged,
        this.onUserAudioStateChanged.bind(this)
      );
    });
  }

  private unbindRoomEngineEvents() {
    this.service.roomEngine.instance?.off(
      TUIRoomEvents.onUserVideoStateChanged,
      this.onUserVideoStateChanged
    );
    this.service.roomEngine.instance?.off(
      TUIRoomEvents.onUserAudioStateChanged,
      this.onUserAudioStateChanged
    );
  }
}
