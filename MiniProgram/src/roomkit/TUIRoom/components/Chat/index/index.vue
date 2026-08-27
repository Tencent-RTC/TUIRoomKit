<template>
  <div class="chat-container-h5">
    <message-list />
    <div
      v-if="isToolPanelOpen"
      class="tool-panel-mask"
      @tap="closeToolPanel"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import MessageList from '../MessageList/index.vue';
import { useChatStore } from '../../../stores/chat';

const chatStore = useChatStore();
const { isToolPanelOpen } = storeToRefs(chatStore);
const closeToolPanel = () => {
  chatStore.setToolPanelOpen(false);
};
</script>

<style lang="scss" scoped>
.chat-container-h5 {
  position: relative;
  height: 100%;
}

.tool-panel-mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
}
</style>
