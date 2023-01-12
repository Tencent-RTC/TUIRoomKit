<template>
  <div
    class="emoji-tool"
  >
    <Popover
      :visible="visible"
      popper-class="emoji-popover"
      placement="top"
      :width="400"
      :show-arrow="false"
      :teleported="false"
    >
      <template #reference>
        <svg-icon
          class="arrow emoji-icon" icon-name="emoji"
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
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { emojiUrl, emojiMap, emojiList } from '../util';
import SvgIcon from '../../common/SvgIcon.vue';
import Popover from '../../../elementComp/Popover.vue';

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
