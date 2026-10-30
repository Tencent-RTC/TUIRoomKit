import { getPlatform } from '@tencentcloud/universal-api';
import PreclassMobile from './PreclassMobile/PreclassMobile.vue';
import PreclassPC from './PreclassPC/PreclassPC.vue';

export const Preclass = getPlatform() === 'pc' ? PreclassPC : PreclassMobile;
export type { ClassRole } from './types';
