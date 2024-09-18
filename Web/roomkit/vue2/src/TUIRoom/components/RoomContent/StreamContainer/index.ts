import StreamContainerH5 from './StreamContainerH5.vue';
import StreamContainerPc from './StreamContainerPC.vue';
import { isMobile } from '../../../utils/environment';

const StreamContainer = isMobile ? StreamContainerH5 : StreamContainerPc;

export default StreamContainer;
