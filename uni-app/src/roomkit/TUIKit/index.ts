import Server from './server';
import TUIComponents, {
  TUIChat,
  TUIConversation,
  TUIContact,
  TUISearch,
  TUIGroup,
} from './components';
import TUIKit from './index.vue';
import { hideTUIChatFeatures } from './components/TUIChat/config';
import { TUIConstants, TUICore, TUILogin } from '@tencentcloud/tui-core';

const TUIChatKit = new Server();
TUIChatKit.init();

function roomChatInit() {
  const { chat } = TUILogin.getContext();
  uni.$tim = chat;

  const handleUpdateMessageInfo = (userInfo: any) => {
    TUICore.callService({
      serviceName: TUIConstants.TUIChat.SERVICE.NAME,
      method: TUIConstants.TUIChat.SERVICE.METHOD.UPDATE_MESSAGE_INFO,
      params: { userInfo },
    });
  };

  uni.$once('update-message-info', (userInfo) => {
    handleUpdateMessageInfo(userInfo);
  });
}

export {
  TUIKit,
  TUIChatKit,
  TUIComponents,
  TUIChat,
  TUIConversation,
  TUIContact,
  TUISearch,
  TUIGroup,
  hideTUIChatFeatures,
  roomChatInit,
};
