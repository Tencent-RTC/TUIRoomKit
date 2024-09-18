import DatepickerPC from './DatepickerPC.vue';
import DatepickerH5 from './DatepickerH5.vue';
import { isMobile } from '../../../../utils/environment';
const Datepicker = isMobile ? DatepickerH5 : DatepickerPC;
export default Datepicker;
