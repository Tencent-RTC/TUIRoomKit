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

export enum StreamPlayMode {
  PLAY = 'play',
  STOP = 'stop',
  PLAY_IN_VISIBLE = 'playInVisible',
}

export enum StreamPlayQuality {
  HIGH = 'high',
  LOW = 'low',
  Default = 'default',
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
    streamInfo!.playDomMap?.set(view, streamType);

    if (!observerViewInVisible) {
      await this.doStartPlayVideo({ userId, streamType });
      return;
    }

    this.initIntersectionObserver();
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
      await this.doStartPlayVideo({ userId, streamType });
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
    if (!streamInfo?.playDomMap || streamInfo?.playDomMap.size === 0) {
      return;
    }

    if (this.observerDataMap.get(view)) {
      this.observerDataMap.delete(view);
      this.intersectionObserver?.unobserve(view);
    }

    streamInfo?.playDomMap.delete(view);
    if (streamInfo?.playDomMap.size > 0) {
      await this.doStartPlayVideo({
        userId,
        streamType,
      });
    } else {
      await this.doStopPlayVideo(options);
    }
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
      if (isIntersecting) {
        observerData.isIntersection = true;
        if (streamInfo?.playDomMap && streamInfo?.playDomMap.size > 0) {
          this.doStartPlayVideo({ userId, streamType });
        }
      } else {
        observerData.isIntersection = false;
        const isContinuePlay = Array.from(
          streamInfo?.playDomMap?.keys() || []
        ).find(
          item =>
            !this.observerDataMap.get(item) ||
            this.observerDataMap.get(item)?.isIntersection
        );
        if (!isContinuePlay) {
          this.doStopPlayVideo({ userId, streamType });
        }
      }
    });
  }

  private getPlayStreamType(userId: string, streamType: TUIVideoStreamType) {
    if (streamType === TUIVideoStreamType.kScreenStream) {
      return streamType;
    }
    const streamInfo = this.service.roomStore.getStreamInfo(userId, streamType);
    if (streamInfo?.playDomMap && streamInfo?.playDomMap.size > 0) {
      const playStreamTypeList = Array.from(streamInfo?.playDomMap?.values());
      if (playStreamTypeList.includes(TUIVideoStreamType.kCameraStream)) {
        return TUIVideoStreamType.kCameraStream;
      }
      return TUIVideoStreamType.kCameraStreamLow;
    }
    return streamType;
  }

  private async doStartPlayVideo(options: {
    userId: string;
    streamType: TUIVideoStreamType;
  }) {
    const { userId, streamType } = options;
    const streamInfo = this.service.roomStore.getStreamInfo(userId, streamType);
    if (!streamInfo) {
      return;
    }
    const playStreamType = this.getPlayStreamType(userId, streamType);
    const viewIdList = Array.from(streamInfo!.playDomMap!.keys()).map(item => {
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
        streamType: playStreamType,
        view: viewIdList,
      });
      await this.setVideoRenderParams({ userId, streamType });
      await this.service.roomEngine.instance?.startPlayRemoteVideo({
        userId,
        streamType: playStreamType,
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

  private async doStopPlayVideo(options: {
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
