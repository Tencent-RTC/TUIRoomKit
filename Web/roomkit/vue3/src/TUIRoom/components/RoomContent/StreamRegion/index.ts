import StreamRegionH5 from './StreamRegionH5.vue';
import StreamRegionPc from './StreamRegionPC.vue';
import { isMobile }  from '../../../utils/environment';

const StreamRegion = isMobile ? StreamRegionH5 : StreamRegionPc;

export default StreamRegion;
