<template>
  <div class="chat-container">
    <message-list></message-list>
    <chat-editor></chat-editor>
  </div>
</template>

<script setup lang="ts">
import MessageList from './MessageList.vue';
import ChatEditor from './ChatEditor.vue';
</script>

<style lang="scss" scoped>
  .chat-container {
    position: relative;
    height: 100%;
  }
</style>
