import { useEffect, useRef } from 'react';
import { useLoginState, useRoomParticipantState } from 'tuikit-atomicx-react/room';
import { IconMark } from '../../../base';
import { useI18n } from '../../../i18n';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile';
import { useWhiteboardState } from '../WhiteboardState';
import '../Whiteboard.global.scss';

export interface AnnotationButtonMobileProps {
  /** Drawing on the share: the stage must hand its touches to the plugin and stay on the share page. */
  onUpdateActive?: (active: boolean) => void;
}

export function AnnotationButtonMobile(props: AnnotationButtonMobileProps) {
  const { onUpdateActive } = props;
  const { t } = useI18n();
  // The phone only follows: drawing on someone else's board or screen share.
  const { loginUserInfo } = useLoginState();
  const { participantWithScreen } = useRoomParticipantState();
  const { isAnnotationOn, isSessionActive, startAnnotation, stopAnnotation } = useWhiteboardState();

  const shareUserId = participantWithScreen?.userId ?? '';
  const sharerId = shareUserId !== loginUserInfo?.userId ? shareUserId : '';
  /** With a remote sharer present the state can only be following that sharer. */
  const active = isAnnotationOn;

  /* Raised while the start is still in flight, so the stage is already on the share page,
     playing it, by the time the SDK binds the annotation to that view. */
  const drawing = !!sharerId && isSessionActive;
  const onUpdateActiveRef = useRef(onUpdateActive);
  onUpdateActiveRef.current = onUpdateActive;
  const previousRef = useRef<boolean | null>(null);
  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = drawing;
    if (drawing || previous) {
      onUpdateActiveRef.current?.(drawing);
    }
  }, [drawing]);
  const drawingRef = useRef(drawing);
  drawingRef.current = drawing;
  useEffect(() => () => {
    if (drawingRef.current) {
      onUpdateActiveRef.current?.(false);
    }
  }, []);

  function toggleAnnotation() {
    const run = active ? stopAnnotation : startAnnotation;
    run().catch((error: unknown) => {
      console.warn('[AnnotationButtonMobile] toggle annotation failed:', error);
    });
  }

  if (!sharerId) {
    return null;
  }
  return (
    <ToolbarButtonMobile
      label={active ? t('Whiteboard.ExitAnnotation') : t('Whiteboard.Annotation')}
      active={active}
      pressed={active}
      onClick={toggleAnnotation}
    >
      <IconMark size={20} />
    </ToolbarButtonMobile>
  );
}

export default AnnotationButtonMobile;
