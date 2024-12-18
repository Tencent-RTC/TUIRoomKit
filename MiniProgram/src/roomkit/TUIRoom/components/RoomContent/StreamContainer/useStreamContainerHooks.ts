import { StreamInfo } from '../../../stores/room';

export default function useStreamContainer() {
  const isSameStream = (
    stream1: StreamInfo | null | undefined,
    stream2: StreamInfo | null | undefined
  ) => getStreamKey(stream1) === getStreamKey(stream2);

  const getStreamKey = (stream: StreamInfo | null | undefined) =>
    `${stream?.userId}_${stream?.streamType}`;

  return {
    isSameStream,
    getStreamKey,
  };
}
