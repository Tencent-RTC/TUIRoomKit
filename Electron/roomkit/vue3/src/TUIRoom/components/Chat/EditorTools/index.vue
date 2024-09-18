<template>
  <div class="emoji-tool">
    <svg-icon
      :icon="EmojiIcon"
      class="emoji-icon"
      @click.stop="handleEmojiToobar"
    />
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
import { emojiBaseUrl, emojiMap, emojiList } from '../util';
import { isMobile } from '../../../utils/environment';
import SvgIcon from '../../common/base/SvgIcon.vue';
import EmojiIcon from '../../common/icons/EmojiIcon.vue';
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
.tui-theme-white .emoji-list {
  --emoji-box-shadow: 0px 2px 4px -3px rgba(32, 77, 141, 0.03),
    0px 6px 10px 1px rgba(32, 77, 141, 0.06),
    0px 3px 14px 2px rgba(32, 77, 141, 0.05);
}

.tui-theme-black .emoji-list {
  --emoji-box-shadow: 0px 8px 40px 0px rgba(23, 25, 31, 0.6),
    0px 4px 12px 0px rgba(23, 25, 31, 0.8);
}

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
    background-color: var(--background-color-8);
    border-radius: 8px;
    box-shadow: var(--emoji-box-shadow);

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
