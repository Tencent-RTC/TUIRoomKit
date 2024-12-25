<template>
  <div class="chat-control-container">
    <tui-badge :hidden="chatStore.unReadCount === 0" :value="chatStore.unReadCount" :max="10">
      <icon-button
        :title="t('Chat')"
        icon="ChatIcon"
        :is-active="sidebarName === 'chat'"
        @click-icon="toggleChatSidebar"
      ></icon-button>
    </tui-badge>
  </div>
</template>

<script setup lang="ts">
import IconButton from '../common/base/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import TuiBadge from '../common/base/Badge.vue';
import defaultAvatar from '../../assets/imgs/avatar.png';
import TUIMessage from '../common/base/Message/index';
const { t } = useI18n();

const basicStore = useBasicStore();
const chatStore = useChatStore();
const { sidebarName } = storeToRefs(basicStore);

function toggleChatSidebar() {
  if (!uni.$tim) {
	  TUIMessage({
	    type: 'error',
	    message: '请集成 Chat 组件',
	    duration: 2000,
	  });
    console.info('请参考 https://cloud.tencent.com/document/product/647/112757 集成 Chat');
    return;
  }
  const conversationID = `GROUP${basicStore.roomId}`;
  const userInfo = { [basicStore.userId]: { nick: basicStore.userName, avatar: basicStore.avatarUrl || defaultAvatar } };
  uni.$emit('update-message-info', userInfo);
  uni.navigateTo({ url: `/src/roomkit/TUIKit/components/TUIChat/index?conversationID=${conversationID}` });
  // eslint-disable-next-line no-undef
  const currentPageRoute = getCurrentPages()?.slice(-1)[0]?.route;
  chatStore.setCurrentsPage(currentPageRoute);
  chatStore.updateUnReadCount(0);
}
</script>
