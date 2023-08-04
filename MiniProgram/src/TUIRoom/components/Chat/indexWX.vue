<template>
  <div class="chat-container-wx">
    <message-list></message-list>
    <chat-editor v-if="!isMobile"></chat-editor>
  </div>
</template>

<script setup lang="ts">
import MessageList from './MessageListWX.vue';
import ChatEditor from './ChatEditor/ChatEditorWX.vue';
import { isMobile } from '../../utils/useMediaValue';
</script>

  <style lang="scss" scoped>
    .chat-container-wx {
      height: 100%;
    }
  </style>

