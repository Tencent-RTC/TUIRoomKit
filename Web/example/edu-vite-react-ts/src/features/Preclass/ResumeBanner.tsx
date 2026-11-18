import { getPlatform } from '@tencentcloud/universal-api';
import { IconClose, TUIButton, useI18n } from '@tencentcloud/roomkit-web-react';
import { CLASS_MODES } from './classMode';
import type { ClassCourse } from './types';

export interface ResumeBannerProps {
  roomId: string;
  course?: ClassCourse;
  onBack: () => void;
  onDismiss: () => void;
}

export default function ResumeBanner({ roomId, course, onBack, onDismiss }: ResumeBannerProps) {
  const { t } = useI18n();
  const isPC = getPlatform() === 'pc';
  const subtitle = [`${t('Preclass.RoomId')} ${roomId}`, course ? t(CLASS_MODES[course.classMode].label) : ''].filter(Boolean).join(' · ');
  return (
    <div className={`preclass-resume ${isPC ? '' : 'is-h5'}`} role="status">
      <span className="preclass-resume-dot" aria-hidden="true" />
      <div className="preclass-resume-text">
        <b>{course ? t('Preclass.ResumeTitle', { title: course.title }) : t('Preclass.ResumeTitleGeneric')}</b>
        <span>{subtitle}</span>
      </div>
      <TUIButton variant="primary" size="sm" onClick={onBack}>{t('Preclass.ResumeBack')}</TUIButton>
      <TUIButton variant="ghost" size="sm" className={isPC ? '' : 'preclass-resume-close'} aria-label={t('Preclass.ResumeDismiss')} onClick={onDismiss}>
        {isPC ? t('Preclass.ResumeDismiss') : <IconClose />}
      </TUIButton>
    </div>
  );
}
