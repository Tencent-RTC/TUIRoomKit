import RoomControlH5 from './RoomControlH5.vue';
import RoomControlPc from './RoomControlPC.vue';
import { isMobile }  from '../../../utils/useMediaValue';

const RoomControl = isMobile ? RoomControlH5 : RoomControlPc;

export default RoomControl;
