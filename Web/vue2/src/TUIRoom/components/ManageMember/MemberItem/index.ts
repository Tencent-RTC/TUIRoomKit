import indexH5 from './indexH5.vue';
import indexPC from './indexPC.vue';

import { isMobile }  from '../../../utils/useMediaValue';

const index = isMobile ? indexH5 : indexPC;

export default index;
