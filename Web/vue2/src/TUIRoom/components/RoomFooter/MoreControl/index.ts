import MoreControlH5 from './MoreControlH5.vue';
import MoreControlPc from './MoreControlPC.vue';

import { isMobile }  from '../../../utils/useMediaValue';

const MoreControl = isMobile ? MoreControlH5 : MoreControlPc;

export default MoreControl;
