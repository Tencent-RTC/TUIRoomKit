<template>
  <div class="emoji-tool">
    <div
      v-for="(childrenItem, childrenIndex) in emojiList"
      :key="childrenIndex"
      @tap="chooseEmoji(childrenItem)"
      class="emoji-item"
    >
      <img class="emoji-image" :src="emojiUrl + emojiMap[childrenItem]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { emojiUrl, emojiMap, emojiList } from '../util';


const emit = defineEmits(['choose-emoji']);
const chooseEmoji = (itemName: string) => {
  const emojiInfo = itemName;
  emit('choose-emoji', emojiInfo);
};

</script>

<style lang="scss" scoped>
  .emoji-tool{
    display: flex;
    justify-content: center;
    background: white;
    flex-wrap: wrap;
    width: 100%;
    height: 200px;
    flex-wrap: wrap;
    overflow-y: auto
  }
  .emoji-item{
    width: 9vw;
    height: 9vw;
    margin: 2vw;
  }
  .emoji-image{
    width: 100%;
    height: 100%;
  }
  </style>

