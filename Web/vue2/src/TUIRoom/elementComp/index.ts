import { Message, MessageBox } from 'element-ui';
import DialogH5 from './DialogH5.vue';
import DialogPc from './DialogPC.vue';
import isMobile from '../utils/useMediaValue';

const ElMessage = Message;

const ElMessageBox = MessageBox;


const Dialog = isMobile ? DialogH5 : DialogPc;

export {
  ElMessage, ElMessageBox, Dialog,
};

