import { TUIButton } from '../../base';
import './EduLeaveCard.scss';

export interface EduLeaveCardProps {
  title: string;
  body: string;
  secondaryText: string;
  confirmText: string;
  /* Views own the exit flow: the teacher's secondary steps out, the student's just closes. */
  onSecondary?: () => void;
  onConfirm?: () => void;
}

export function EduLeaveCard(props: EduLeaveCardProps) {
  const { title, body, secondaryText, confirmText, onSecondary, onConfirm } = props;

  return (
    <section className="education-leave-card" role="dialog" aria-label={title}>
      <h3 className="education-leave-card-title">
        {title}
      </h3>
      <p className="education-leave-card-body">
        {body}
      </p>
      <div className="education-leave-card-actions">
        <TUIButton size="sm" onClick={() => onSecondary?.()}>
          {secondaryText}
        </TUIButton>
        <TUIButton variant="danger" size="sm" onClick={() => onConfirm?.()}>
          {confirmText}
        </TUIButton>
      </div>
    </section>
  );
}

export default EduLeaveCard;
