import indexH5 from './indexH5.vue';
import indexPc from './indexPC.vue';
import { isMobile } from '../../../utils/environment';

const Index = isMobile ? indexH5 : indexPc;

export default Index;
