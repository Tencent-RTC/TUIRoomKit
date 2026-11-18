import { forwardRef, useImperativeHandle, useState } from 'react';
import CourseList from './CourseList';
import type { CourseListProps } from './CourseList';
import WeekStrip from './WeekStrip';
import { dayStart, sameDay, toDateKey } from './scheduleTime';

export interface CourseBoardHandle {
  showDay: (day: Date) => void;
}

const CourseBoard = forwardRef<CourseBoardHandle, CourseListProps & { now: number }>((props, ref) => {
  const [selectedDay, setSelectedDay] = useState(() => dayStart(new Date(props.now)));
  useImperativeHandle(ref, () => ({ showDay: day => setSelectedDay(dayStart(day)) }), []);
  const markedDays = new Set(props.courses.map(course => toDateKey(new Date(course.start * 1000))));
  const dayCourses = props.courses.filter(course => sameDay(new Date(course.start * 1000), selectedDay)).sort((a, b) => a.start - b.start);
  return (
    <div className="preclass-board">
      <WeekStrip selected={selectedDay} markedDays={markedDays} now={props.now} onSelect={day => setSelectedDay(dayStart(day))} />
      <CourseList {...props} courses={dayCourses} />
    </div>
  );
});
CourseBoard.displayName = 'CourseBoard';
export default CourseBoard;
