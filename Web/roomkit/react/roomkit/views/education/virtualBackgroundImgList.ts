import type { BackgroundPhoto } from '../../features';
import virtualBgLectureHall from './assets/virtual-backgrounds/lecture-hall.jpeg';
import virtualBgLibrary from './assets/virtual-backgrounds/library.jpeg';
import virtualBgMathClassroom from './assets/virtual-backgrounds/math-classroom.jpeg';
import virtualBgReadingCorner from './assets/virtual-backgrounds/reading-corner.jpeg';
import virtualBgScienceLab from './assets/virtual-backgrounds/science-lab.jpeg';
import virtualBgStudyRoom from './assets/virtual-backgrounds/study-room.jpeg';

// Ids must not overlap with the built-in conference set: the image cache is keyed by id.
export const EDUCATION_VIRTUAL_BACKGROUND_IMG_LIST: BackgroundPhoto[] = [
  { id: 'e1', imagePath: virtualBgReadingCorner },
  { id: 'e2', imagePath: virtualBgMathClassroom },
  { id: 'e3', imagePath: virtualBgStudyRoom },
  { id: 'e4', imagePath: virtualBgLibrary },
  { id: 'e5', imagePath: virtualBgLectureHall },
  { id: 'e6', imagePath: virtualBgScienceLab },
];
