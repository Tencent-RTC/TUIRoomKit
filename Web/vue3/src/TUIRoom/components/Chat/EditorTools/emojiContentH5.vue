<template>
  <div class="emoji-tool">
    <svg-icon class="arrow emoji-icon" icon-name="emoji-h5" size="medium" @click="togglePopover" />
    <Teleport to="body">
      <div v-if="visible" ref="emojiListRef" class="emoji-list">
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
import { ref, onMounted, onUnmounted } from 'vue';
import { emojiUrl, emojiMap, emojiList } from '../util';
import SvgIcon from '../../common/SvgIcon.vue';

const visible = ref(false);
const emit = defineEmits(['choose-emoji']);
const emojiListRef = ref();

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

function handleDocumentClick(event: MouseEvent) {
  if (visible.value && !emojiListRef.value.contains(event.target)) {
    visible.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick, true);
});
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
  bottom: 174px;
  left: 16px;
  background-color: var(--emoji-background-color);
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
