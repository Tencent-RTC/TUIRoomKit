<template>
  <div class="emoji-tool">
    <IconEmoji class="emoji-icon" @click.stop="handleEmojiToobar" />
    <div
      v-show="showEmojiToolbar"
      v-click-outside="handleClickOutsideEmojiToobar"
      :class="isMobile ? 'emoji-list-h5' : 'emoji-list'"
    >
      <div
        v-for="(childrenItem, childrenIndex) in emojiList"
        :key="childrenIndex"
        class="emoji-item"
        @click="chooseEmoji(childrenItem)"
      >
        <img :src="emojiBaseUrl + emojiMap[childrenItem]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconEmoji } from '@tencentcloud/uikit-base-component-vue3';
import { emojiBaseUrl, emojiMap, emojiList } from '../util';
import { isMobile } from '../../../utils/environment';
import vClickOutside from '../../../directives/vClickOutside';

const emit = defineEmits(['choose-emoji']);
const showEmojiToolbar = ref(false);
const chooseEmoji = (itemName: string) => {
  const emojiInfo = itemName;
  emit('choose-emoji', emojiInfo);
};
const handleEmojiToobar = () => {
  showEmojiToolbar.value = !showEmojiToolbar.value;
};
const handleClickOutsideEmojiToobar = () => {
  if (showEmojiToolbar.value) {
    showEmojiToolbar.value = false;
  }
};
</script>

<style lang="scss" scoped>
.emoji-tool {
  .emoji-icon {
    cursor: pointer;
  }

  .emoji-list,
  .emoji-list-h5 {
    position: absolute;
    bottom: 160px;
    left: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    width: 100%;
    height: 204px;
    padding: 10px;
    overflow-y: auto;
    border-radius: 8px;
    background-color: var(--bg-color-function);
    box-shadow:
      0px 8px 40px 0px var(--uikit-color-black-8),
      0px 4px 12px 0px var(--uikit-color-black-8);

    &::-webkit-scrollbar {
      display: none;
    }

    .emoji-item {
      &:hover {
        cursor: pointer;
      }
    }

    img {
      width: 23px;
      height: 23px;
    }
  }

  .emoji-list-h5 {
    position: fixed;
    bottom: 77px;
    left: 30px;
    width: 298px;
    height: 148px;
  }
}
</style>
