import { getPlatform } from '@tencentcloud/universal-api';
import EducationViewMobile from './EducationViewMobile';
import EducationViewPC from './EducationViewPC';

/** Same static platform pick as the conference scene. */
export const EducationView = getPlatform() === 'pc' ? EducationViewPC : EducationViewMobile;
