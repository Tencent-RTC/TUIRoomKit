<template>
  <div class="emoji-tool">
    <svg-icon class="arrow emoji-icon" icon-name="emoji-h5" size="medium" @click="togglePopover" />
    <Teleport to="body">
      <div v-if="visible" class="emoji-list">
        <div
          v-for="(childrenItem, childrenIndex) in emojiList"
          :key="childrenIndex"
          class="emoji-item"
          @click="chooseEmoji(childrenItem)"
        >
          <img :src="emojiUrl + emojiMap[childrenItem]" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { emojiUrl, emojiMap, emojiList } from '../util';
import SvgIcon from '../../common/SvgIcon.vue';

const visible = ref(false);
const emit = defineEmits(['choose-emoji']);
const chooseEmoji = (itemName: string) => {
  const emojiInfo = itemName;
  closePopover();
  emit('choose-emoji', emojiInfo);
};

const togglePopover = () => {
  visible.value = !visible.value;
};

const closePopover = () => {
  visible.value = false;
};
</script>

<style lang="scss" scoped>
.emoji-list {
  width: 223px;
  height: 120px;
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  overflow-y: auto;
  position: absolute;
  bottom: 199px;
  left: 20px;
  background-color: #2f313b;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #6f727b;
  &::-webkit-scrollbar {
    display: none; /* Chrome Safari */
  }
  .emoji-item {
    padding: 2px;
    &:hover {
      cursor: pointer;
    }
  }
  img {
    width: 30px;
  }
}
</style>
