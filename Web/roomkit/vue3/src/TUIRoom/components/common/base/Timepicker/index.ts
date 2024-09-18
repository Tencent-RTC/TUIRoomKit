import TimepickerPC from './TimepickerPC.vue';
import TimepickerH5 from './TimepickerH5.vue';
import { isMobile } from '../../../../utils/environment';
const Timepicker = isMobile ? TimepickerH5 : TimepickerPC;
export default Timepicker;
