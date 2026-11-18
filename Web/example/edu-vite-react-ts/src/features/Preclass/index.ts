import { getPlatform } from '@tencentcloud/universal-api';
import PreclassMobile from './PreclassMobile/PreclassMobile';
import PreclassPC from './PreclassPC/PreclassPC';
import './Preclass.scss';

/** H5 is student-only, matching the education Vue lobby. */
export function resolvePreclass() {
  return getPlatform() !== 'pc' ? PreclassMobile : PreclassPC;
}

export const Preclass = resolvePreclass();
export { PreclassMobile, PreclassPC };
export type { ClassCourse, ClassRole, PreclassProps } from './types';
export { CLASS_MODES, getClassMode } from './classMode';
export type { ClassMode } from './classMode';
export { useClassRole, switchClassRole } from './classRole';
export { rememberResumeRoom, forgetResumeRoom, useResumeRoom } from './useResumeRoom';
export default Preclass;
