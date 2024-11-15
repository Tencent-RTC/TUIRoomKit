<template>
  <div class="chat-container">
    <message-list></message-list>
    <emoji-list
      v-if="isEmojiToolbarVisible" class="chat-emoji"
      style="width: 750rpx; height: 200px; position: absolute; bottom: 80px;" @choose-emoji="handleChooseEmoji"
    ></emoji-list>
    <chat-editor ref="editor" @on-show-emoji="handleShowEmoji"></chat-editor>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MessageList from './MessageList/index.vue';
import ChatEditor from './ChatEditor/index.vue';
import emojiList from './EditorTools/index.vue';

const isEmojiToolbarVisible = ref(false);

const editor = ref();


const handleShowEmoji = (event: boolean) => {
  isEmojiToolbarVisible.value = event;
};

const handleChooseEmoji = (emojiName: string) => {
  editor.value.handleChooseEmoji(emojiName);
};


</script>

<style lang="scss" scoped></style>
