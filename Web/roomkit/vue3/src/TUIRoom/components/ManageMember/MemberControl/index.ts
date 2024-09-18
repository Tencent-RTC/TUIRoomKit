import MemberControlH5 from './MemberControlH5.vue';
import MemberControlPC from './MemberControlPC.vue';

import { isMobile } from '../../../utils/environment';

const MemberControl = isMobile ? MemberControlH5 : MemberControlPC;

export default MemberControl;
