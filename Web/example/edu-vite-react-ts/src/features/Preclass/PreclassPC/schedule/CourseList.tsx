import { IconCourseEmpty, TUILoading, useI18n } from '@tencentcloud/roomkit-web-react';
import CourseCard from './CourseCard';
import type { ClassCourse } from '../../types';
import type { CourseMoreCommand } from './useClassSchedule';

export interface CourseListProps {
  courses: ClassCourse[];
  canManage: boolean;
  isLoaded: boolean;
  linkOf: (roomId: string) => string;
  onJoin: (roomId: string) => void;
  onOpen: (course: ClassCourse) => void;
  onMore: (course: ClassCourse, command: CourseMoreCommand) => void;
}

export default function CourseList({ courses, canManage, isLoaded, linkOf, onJoin, onOpen, onMore }: CourseListProps) {
  const { t } = useI18n();
  return (
    <div className="preclass-list" aria-label={t('Preclass.CourseList')} role="list">
      {!courses.length && (
        <div className="preclass-list-empty" role={!isLoaded ? 'status' : undefined}>
          {!isLoaded
            ? <TUILoading size="lg" />
            : (
              <>
                <IconCourseEmpty className="preclass-list-empty-art" />
                <span>{t('Preclass.ListEmpty')}</span>
              </>
            )}
        </div>
      )}
      {courses.map(course => <CourseCard key={course.roomId} course={course} link={linkOf(course.roomId)} canManage={canManage} onJoin={onJoin} onOpen={onOpen} onMore={onMore} />)}
    </div>
  );
}
