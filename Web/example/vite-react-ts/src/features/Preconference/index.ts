import { getPlatform } from '@tencentcloud/universal-api';
import PreconferenceMobile from './PreconferenceMobile/PreconferenceMobile';
import PreconferencePC from './PreconferencePC/PreconferencePC';

export const Preconference = getPlatform() === 'pc' ? PreconferencePC : PreconferenceMobile;
