import EndControlH5 from './EndControlH5.vue';
import EndControlPC from './EndControlPC.vue';

import { isMobile } from '../../../utils/environment';

const EndControl = isMobile ? EndControlH5 : EndControlPC;

export default EndControl;
