import indexH5 from '../roomHeaderH5/index.vue';
import indexPC from '../roomHeaderPC/index.vue';

import { isMobile } from '../../../utils/environment';

const index = isMobile ? indexH5 : indexPC;

export default index;
