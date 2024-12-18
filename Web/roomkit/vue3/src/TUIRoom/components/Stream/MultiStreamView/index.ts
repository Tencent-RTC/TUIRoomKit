import MultiStreamViewH5 from './MultiStreamViewH5.vue';
import MultiStreamViewPC from './MultiStreamViewPC.vue';
import { isMobile } from '../../../utils/environment';

const MultiStreamView = isMobile ? MultiStreamViewH5 : MultiStreamViewPC;

export default MultiStreamView;
