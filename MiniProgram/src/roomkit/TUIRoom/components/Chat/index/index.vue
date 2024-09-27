<template>
  <div class="chat-container-h5">
    <message-list />
    <chat-editor />
  </div>
</template>

<script setup lang="ts">
import MessageList from '../MessageList/index.vue';
import ChatEditor from '../ChatEditor/index.vue';
</script>

<style lang="scss" scoped>
.chat-container-h5 {
  height: 100%;
}
</style>
