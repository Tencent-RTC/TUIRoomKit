<template>
  <div
    class="emoji-tool"
  >
    <el-popover
      v-model:visible="visible"
      popper-class="emoji-popover"
      placement="top"
      :width="400"
      :show-arrow="false"
      :teleported="false"
    >
      <template #reference>
        <svg-icon
          v-click-outside="onClickOutside" class="arrow emoji-icon" icon-name="emoji"
          size="medium"
          @click="togglePopover"
        />
      </template>
      <template #default>
        <div class="emoji-list">
          <div
            v-for="(childrenItem, childrenIndex) in emojiList"
            :key="childrenIndex"
            class="emoji-item"
            @click="chooseEmoji(childrenItem)"
          >
            <img :src="emojiUrl + emojiMap[childrenItem]">
          </div>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ClickOutside as vClickOutside } from 'element-plus';
import { emojiUrl, emojiMap, emojiList } from '../util';
import SvgIcon from '../../common/SvgIcon.vue';

const visible = ref(false);

const emit = defineEmits(['chooseEmoji']);
const chooseEmoji = (itemName: string) => {
  const emojiInfo = itemName;
  closePopover();
  emit('chooseEmoji', emojiInfo);
};

const onClickOutside = (e: Event) => {
  const emojiPopover = (e.target as HTMLElement).closest('.emoji-popover');
  if (!emojiPopover) {
    closePopover();
  }
};
const togglePopover = () => {
  visible.value = !visible.value;
};

const closePopover = () => {
  visible.value = false;
};

</script>

<style lang="scss" scoped>
  .emoji-icon {
    &:hover {
      cursor: pointer;
    }
  }
  .emoji-list {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    overflow-y: auto;
    &::-webkit-scrollbar {
      display: none; /* Chrome Safari */
    }
    height: 200px;
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
