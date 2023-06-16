import { ElMessage, ElMessageBox } from 'element-plus';
/// @TUIRoom-PlatformAdapter-Start
import DialogH5 from './DialogH5.vue';
import DialogPC from './DialogPC.vue';
import isMobile from '../utils/useMediaValue';
const Dialog = isMobile ? DialogH5 : DialogPC;

export {
  ElMessage, ElMessageBox, Dialog,
};
/// @TUIRoom-PlatformAdapter-End
