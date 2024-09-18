import DialogH5 from './DialogH5.vue';
import DialogPC from './DialogPC.vue';
import { isMobile } from '../../../../utils/environment';
const Dialog = isMobile ? DialogH5 : DialogPC;

export default Dialog;
