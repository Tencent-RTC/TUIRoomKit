import DialogH5 from './DialogH5.vue';
import DialogPC from './DialogPC.vue';
import isMobile from '../../utils/useMediaValue';
const Dialog = isMobile ? DialogH5 : DialogPC;

export default Dialog;
