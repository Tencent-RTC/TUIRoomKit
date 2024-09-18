<template>
  <div class="emoji-tool">
    <div
      v-for="(childrenItem, childrenIndex) in emojiList"
      :key="childrenIndex"
      v-tap="() => chooseEmoji(childrenItem)"
      class="emoji-item"
    >
      <img class="emoji-image" :src="emojiBaseUrl + emojiMap[childrenItem]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { emojiBaseUrl, emojiMap, emojiList } from '../util';
import vTap from '../../../directives/vTap';

const emit = defineEmits(['choose-emoji']);
const chooseEmoji = (itemName: string) => {
  const emojiInfo = itemName;
  emit('choose-emoji', emojiInfo);
};
</script>

<style lang="scss" scoped>
.emoji-tool {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  height: 200px;
  overflow-y: auto;
  background: var(--background-color-8);
}

.emoji-item {
  width: 9vw;
  height: 9vw;
  margin: 2vw;
}

.emoji-image {
  width: 100%;
  height: 100%;
}
</style>
