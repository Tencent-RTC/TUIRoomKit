import MoreControlH5 from './MoreControlH5.vue';
import MoreControlPc from './MoreControlPC.vue';

import { isMobile } from '../../../utils/environment';

const MoreControl = isMobile ? MoreControlH5 : MoreControlPc;

export default MoreControl;
