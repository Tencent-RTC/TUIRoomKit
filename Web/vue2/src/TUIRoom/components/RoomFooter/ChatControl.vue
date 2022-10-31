<template>
  <div class="chat-control-container">
    <el-badge
      v-if="chatStore.unReadCount > 0"
      :value="chatStore.unReadCount > 10 ? '10+' : chatStore.unReadCount"
    >
      <icon-button
        title="聊天"
        :icon-name="iconName"
        @click-icon="toggleChatSidebar"
      />
    </el-badge>
    <icon-button
      v-else
      title="聊天"
      :icon-name="iconName"
      @click-icon="toggleChatSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IconButton from '../common/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import { ICON_NAME } from '../../constants/icon';

const basicStore = useBasicStore();
const chatStore = useChatStore();
const { sidebarName } = storeToRefs(basicStore);

const iconName = computed(() => (sidebarName.value === 'chat' ? ICON_NAME.ChatActive : ICON_NAME.Chat));

function toggleChatSidebar() {
  if (basicStore.setSidebarOpenStatus && basicStore.sidebarName === 'chat') {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    return;
  }

  basicStore.setSidebarOpenStatus(true);
  basicStore.setSidebarName('chat');
  chatStore.updateUnReadCount(0);
}
</script>

<style lang="scss">
.chat-control-container .el-badge .el-badge__content {
  top: 14px;
  right: 24px;
  background-color: #006EFF;
}
</style>
