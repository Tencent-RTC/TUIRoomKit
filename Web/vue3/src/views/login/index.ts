import isMobile from '../../TUIRoom/utils/useMediaValue';
import loginH5 from './loginH5.vue';
import loginPc from './loginPC.vue';

const login = isMobile ? loginH5 : loginPc;

export default login;
