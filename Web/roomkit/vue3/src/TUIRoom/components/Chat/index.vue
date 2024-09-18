<template>
  <div :class="[isMobile ? 'chat-container-h5' : 'chat-container']">
    <message-list />
    <chat-editor v-if="!isMobile" />
  </div>
</template>

<script setup lang="ts">
import MessageList from './MessageList';
import ChatEditor from './ChatEditor';
import { isMobile } from '../../utils/environment';
</script>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.chat-container-h5 {
  height: 100%;
}
</style>
