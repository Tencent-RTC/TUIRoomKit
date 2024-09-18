import RoomControlH5 from './RoomControlH5.vue';
import RoomControlPc from './RoomControlPC.vue';
import { isMobile } from '../../../utils/environment';

const RoomControl = isMobile ? RoomControlH5 : RoomControlPc;

export default RoomControl;
