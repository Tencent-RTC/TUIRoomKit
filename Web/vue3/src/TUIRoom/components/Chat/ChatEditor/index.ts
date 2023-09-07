import ChatEditorH5 from './ChatEditorH5.vue';
import ChatEditorPC from './ChatEditorPC.vue';
import { isMobile }  from '../../../utils/useMediaValue';


const ChatEditor = isMobile ? ChatEditorH5 : ChatEditorPC;

export default ChatEditor;

