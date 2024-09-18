import OptionPC from './OptionPC.vue';
import OptionH5 from './OptionH5.vue';
import { isMobile } from '../../../../utils/environment';
const OPtion = isMobile ? OptionH5 : OptionPC;
export default OPtion;
