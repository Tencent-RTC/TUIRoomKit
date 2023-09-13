<template>
  <div class="emoji-tool">
    <svg-icon class="arrow emoji-icon" icon-name="emoji-h5" size="medium" @click="togglePopover" />
    <div v-if="visible" id="emoji-list" ref="emojiListRef" :class="isMobile? 'emoji-list-h5':'emoji-list'">
      <div
        v-for="(childrenItem, childrenIndex) in emojiList"
        :key="childrenIndex"
        class="emoji-item"
        @click="chooseEmoji(childrenItem)"
      >
        <img :src="emojiUrl + emojiMap[childrenItem]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { emojiUrl, emojiMap, emojiList } from '../util';
import SvgIcon from '../../common/SvgIcon.vue';
import { isMobile }  from '../../../utils/useMediaValue';
const emojiListRef = ref();

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
.emoji-icon {
  cursor: pointer;
}
.emoji-list,.emoji-list-h5 {
  width: 404px;
  height: 214px;
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  overflow-y: auto;
  position: absolute;
  bottom: 50px;
  background-color: var(--emoji-background-color);
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #2e323d;
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
.emoji-list-h5 {
  width: 298px;
  height: 148px;
  position: fixed;
  bottom: 77px;
  left: 30px;
}
</style>
