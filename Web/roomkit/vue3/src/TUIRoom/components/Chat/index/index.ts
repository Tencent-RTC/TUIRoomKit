import indexH5 from './indexH5.vue';
import indexPC from './indexPC.vue';
import { isMobile } from '../../../utils/environment';

const Index = isMobile ? indexH5 : indexPC;

export default Index;
