import {
  DeviceStatus,
  VideoStreamType,
  useDeviceState,
  useLoginState,
} from 'tuikit-atomicx-react/room';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import { IconMark, TUIButton } from '../../../base';
import { useI18n } from '../../../i18n';
import { useWhiteboardState } from '../WhiteboardState';
import './AnnotationButton.scss';

export interface AnnotationButtonProps {
  participant: RoomParticipant;
  streamType: VideoStreamType;
}

export function AnnotationButton(props: AnnotationButtonProps) {
  const { participant, streamType } = props;
  const { t } = useI18n();
  const { loginUserInfo } = useLoginState();
  const { screenStatus } = useDeviceState();
  const { isAnnotationOn, startAnnotation, stopAnnotation } = useWhiteboardState();

  const isLocal = participant.userId === loginUserInfo?.userId;
  /** A local share tile without a real screen share is the local board, whose toolbar stays open. */
  const isLocalBoard = isLocal && screenStatus === DeviceStatus.Off;
  const isShareTile = streamType === VideoStreamType.Screen && !isLocalBoard;

  function toggle() {
    const run = isAnnotationOn ? stopAnnotation() : startAnnotation();
    run.catch((error: unknown) => {
      console.warn('[AnnotationButton] toggle annotation failed:', error);
    });
  }

  if (!isShareTile) {
    return null;
  }
  return (
    <TUIButton
      className="annotation-button"
      variant="primary"
      size="sm"
      iconSlot={<IconMark size={10} />}
      onClick={(event) => {
        event.stopPropagation();
        toggle();
      }}
    >
      {isAnnotationOn ? t('Whiteboard.EndAnnotation') : t('Whiteboard.Annotation')}
    </TUIButton>
  );
}

export default AnnotationButton;
