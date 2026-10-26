import { getPlatform } from '@tencentcloud/universal-api';
import PreconferenceMobile from './PreconferenceMobile/PreconferenceMobile.vue';
import PreconferencePC from './PreconferencePC/PreconferencePC.vue';

export const Preconference = getPlatform() === 'pc' ? PreconferencePC : PreconferenceMobile;
