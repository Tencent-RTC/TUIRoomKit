import { useEffect, useState } from 'react';
import {
  DeviceStatus,
  VideoStreamType,
  useDeviceState,
  useLoginState,
} from 'tuikit-atomicx-react/room';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import { TUILoading } from '../../../base';
import { useI18n } from '../../../i18n';
import { useWhiteboardState, useWhiteboardViewBinding } from '../WhiteboardState';
import '../Whiteboard.global.scss';
import './WhiteboardView.scss';

export interface WhiteboardViewProps {
  participant: RoomParticipant;
  streamType: VideoStreamType;
}

export function WhiteboardView(props: WhiteboardViewProps) {
  const { participant, streamType } = props;
  const { t } = useI18n();
  const { loginUserInfo } = useLoginState();
  const { screenStatus } = useDeviceState();
  const { isWhiteboardOn } = useWhiteboardState();
  const { isOpening, isLoading, bindView } = useWhiteboardViewBinding();

  /**
   * The local board shows up as the local share tile (the state marks the local
   * share on while it runs); the canvas element is the view it draws into.
   * The tile is already up while the SDK start is in flight.
   */
  const visible = (isWhiteboardOn || isOpening)
    && screenStatus === DeviceStatus.Off
    && streamType === VideoStreamType.Screen
    && participant.userId === loginUserInfo?.userId;

  const showLoading = visible && isLoading;

  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [view, setView] = useState<HTMLDivElement | null>(null);

  // The SDK JSON-serializes plugin options, and React-owned nodes carry circular fiber
  // keys, so the view handed to it is a plain element React never touches.
  useEffect(() => {
    if (!host) {
      return undefined;
    }
    const element = document.createElement('div');
    element.className = 'whiteboard-view-canvas';
    host.appendChild(element);
    setView(element);
    return () => {
      element.remove();
      setView(null);
    };
  }, [host]);

  useEffect(() => {
    if (!view || !isWhiteboardOn) {
      return;
    }
    bindView(view).catch((error: unknown) => {
      console.warn('[WhiteboardView] attach view failed:', error);
    });
  }, [view, isWhiteboardOn, bindView]);

  if (!visible) {
    return null;
  }
  return (
    <div className="whiteboard-view">
      <div ref={setHost} className="whiteboard-view-host" />
      {showLoading && (
        <div className="whiteboard-view-loading">
          <TUILoading size="lg" tip={t('Whiteboard.Loading')} />
        </div>
      )}
    </div>
  );
}

export default WhiteboardView;
