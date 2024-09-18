import InputPC from './InputPC.vue';
import InputH5 from './InputH5.vue';

import { isMobile } from '../../../../utils/environment';
const Input = isMobile ? InputH5 : InputPC;
export default Input;
