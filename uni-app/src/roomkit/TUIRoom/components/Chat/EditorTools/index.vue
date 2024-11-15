<template>
  <div class="emoji-tool">
    <div
      v-for="(childrenItem, childrenIndex) in emojiList"
      :key="childrenIndex"
      class="emoji-item"
      @tap="() => chooseEmoji(childrenItem)"
    >
      <image class="emoji-image" :src="emojiBaseUrl + emojiMap[childrenItem]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import { emojiBaseUrl, emojiMap, emojiList } from '../util';


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
    background: #FFFFFF;
    flex-wrap: wrap;
    width: 20rpx;
    height: 600px;
    flex-wrap: wrap;
    overflow-y: auto
  }
  .emoji-item{
    width: 30px;
    height: 30px;
    margin: 5px;
  }
  .emoji-image{
    width: 30px;
    height: 30px;
  }
  </style>

