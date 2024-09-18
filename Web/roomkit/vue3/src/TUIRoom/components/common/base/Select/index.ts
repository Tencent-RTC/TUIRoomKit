import SelectPC from './SelectPC.vue';
import SelectH5 from './SelectH5.vue';
import { isMobile } from '../../../../utils/environment';
const Select = isMobile ? SelectH5 : SelectPC;
export default Select;
