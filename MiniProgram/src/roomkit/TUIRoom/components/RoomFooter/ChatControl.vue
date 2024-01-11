<template>
  <div class="chat-control-container">
    <tui-badge :hidden="chatStore.unReadCount === 0" :value="chatStore.unReadCount" :max="10">
      <icon-button
        :title="t('Chat')"
        :icon="ChatIcon"
        :is-active="sidebarName === 'chat'"
        @click-icon="toggleChatSidebar"
      ></icon-button>
    </tui-badge>
  </div>
</template>

<script setup lang="ts">
import IconButton from '../common/base/IconButton.vue';
import ChatIcon from '../../assets/icons/ChatIcon.svg';
import { useBasicStore } from '../../stores/basic';
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import TuiBadge from '../common/base/Badge.vue';
const { t } = useI18n();

const basicStore = useBasicStore();
const chatStore = useChatStore();
const { sidebarName } = storeToRefs(basicStore);

async function toggleChatSidebar() {
  if (basicStore.isSidebarOpen && basicStore.sidebarName === 'chat') {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    return;
  }
  basicStore.setSidebarOpenStatus(true);
  basicStore.setSidebarName('chat');
  chatStore.updateUnReadCount(0);
}
</script>
