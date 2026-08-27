<template>
  <div class="emoji-tool">
    <div
      v-for="(childrenItem, childrenIndex) in emojiList"
      :key="childrenIndex"
      @tap="() => chooseEmoji(childrenItem)"
      class="emoji-item"
    >
      <img class="emoji-image" :src="emojiBaseUrl + emojiMap[childrenItem]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { emojiBaseUrl, emojiMap, emojiList } from '../util';

const emit = defineEmits(['choose-emoji']);
const chooseEmoji = (itemName: string) => {
  const emojiInfo = itemName;
  emit('choose-emoji', emojiInfo);
};
</script>

<style lang="scss" scoped>
.emoji-tool {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  justify-items: center;
  align-content: start;
  box-sizing: border-box;
  width: 100%;
  height: 200px;
  padding: 8px 4px 12px;
  overflow-y: auto;
  background-color: var(--bg-color-function);
  box-shadow: var(--uikit-color-black-8);
}

.emoji-item {
  width: 9vw;
  height: 9vw;
  margin: 6px 0;
}

.emoji-image {
  width: 100%;
  height: 100%;
}
</style>
