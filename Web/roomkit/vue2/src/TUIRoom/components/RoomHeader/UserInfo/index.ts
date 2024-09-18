import UserInfoH5 from './UserInfoH5.vue';
import UserInfoPc from './UserInfoPC.vue';
import { isMobile } from '../../../utils/environment';

const UserInfo = isMobile ? UserInfoH5 : UserInfoPc;

export default UserInfo;
