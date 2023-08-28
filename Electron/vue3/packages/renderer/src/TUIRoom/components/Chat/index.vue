<template>
  <div :class="[isMobile ? 'chat-container-h5' : 'chat-container' ]">
    <message-list></message-list>
    <chat-editor v-if="!isMobile"></chat-editor>
  </div>
</template>

<script setup lang="ts">
import MessageList from './MessageList/index.vue';
import ChatEditor from './ChatEditor/index.vue';
import { isMobile }  from '../../utils/useMediaValue';
</script>

<style lang="scss" scoped>
  .chat-container {
    position: relative;
    height: 100%;
  }
  .chat-container-h5 {
    height: 100%;
  }
</style>
