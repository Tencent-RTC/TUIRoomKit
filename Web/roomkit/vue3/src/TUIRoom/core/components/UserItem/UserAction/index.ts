import UserActionH5 from './indexH5.vue';
import UserActionPC from './indexPC.vue';

import { isMobile } from '../../../../utils/environment';

const UserAction = isMobile ? UserActionH5 : UserActionPC;

export default UserAction;
