import { getPlatform } from '@tencentcloud/universal-api';
import EducationViewMobile from './EducationViewMobile.vue';
import EducationViewPC from './EducationViewPC.vue';

/** Same static platform pick as the conference scene. */
export const EducationView = getPlatform() === 'pc' ? EducationViewPC : EducationViewMobile;
