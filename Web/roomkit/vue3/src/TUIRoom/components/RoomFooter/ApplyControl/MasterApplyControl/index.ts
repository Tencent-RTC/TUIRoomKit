import MasterApplyControlH5 from './MasterApplyControlH5.vue';
import MasterApplyControlPC from './MasterApplyControlPC.vue';

import { isMobile } from '../../../../utils/environment';

const MasterApplyControl = isMobile
  ? MasterApplyControlH5
  : MasterApplyControlPC;

export default MasterApplyControl;
