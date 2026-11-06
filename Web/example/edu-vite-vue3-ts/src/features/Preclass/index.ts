import { getPlatform } from '@tencentcloud/universal-api';
import PreclassMobile from './PreclassMobile/PreclassMobile.vue';
import PreclassPC from './PreclassPC/PreclassPC.vue';

/** The H5 lobby is student-only. */
export function resolvePreclass() {
  return getPlatform() !== 'pc' ? PreclassMobile : PreclassPC;
}
