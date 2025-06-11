import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import {
  Comparator,
  createComparator,
  combineComparators,
} from '../../../utils/utils';
import { StreamInfo, StreamPlayState } from '../../type';

export function getNewStreamInfo(
  userId: string,
  streamType?: TUIVideoStreamType
) {
  const newStreamInfo = {
    userId,
    streamType: streamType || TUIVideoStreamType.kCameraStream,
    streamId: `${userId}_${streamType || TUIVideoStreamType.kCameraStream}`,
    hasAudioStream: false,
    audioVolume: 0,
    hasVideoStream: false,
    streamPlayState: StreamPlayState.Stopped,
    streamPlayDomMap: new Map(),
    timestamp: Date.now(),
  };
  return newStreamInfo;
}

let streamListCompareFunction: Comparator<StreamInfo>;
export function setStreamListSortComparator(
  comparator: Comparator<StreamInfo>
) {
  streamListCompareFunction = comparator;
}

export function getStreamListSortComparator({ roomStore }: { roomStore: any }) {
  const defaultUserListCompareFunction = combineComparators(
    createComparator((streamInfo: StreamInfo) =>
      Boolean(streamInfo.streamType === TUIVideoStreamType.kScreenStream)
    ),
    createComparator((streamInfo: StreamInfo) =>
      Boolean(streamInfo.userId === roomStore.roomInfo.ownerId)
    ),
    createComparator((streamInfo: StreamInfo) =>
      Boolean(streamInfo.userId === roomStore.localUserId)
    ),
    createComparator((streamInfoA: StreamInfo) =>
      Boolean(streamInfoA.hasAudioStream && streamInfoA.hasVideoStream)
    ),
    createComparator((streamInfoA: StreamInfo) =>
      Boolean(streamInfoA.hasVideoStream)
    ),
    createComparator((streamInfoA: StreamInfo) =>
      Boolean(streamInfoA.hasAudioStream)
    ),
    createComparator((streamInfoA: StreamInfo, streamInfoB: StreamInfo) =>
      Boolean(Number(streamInfoA.timestamp) - Number(streamInfoB.timestamp))
    )
  );
  return streamListCompareFunction || defaultUserListCompareFunction;
}
