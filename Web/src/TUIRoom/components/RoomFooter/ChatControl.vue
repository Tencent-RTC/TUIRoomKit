<template>
  <div class="chat-control-container">
    <icon-button
      title="聊天"
      :icon-name="iconName"
      @click-icon="toggleChatSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IconButton from '../common/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';

const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);

const iconName = computed(() => (sidebarName.value === 'chat' ? 'chat-active' : 'chat'));

function toggleChatSidebar() {
  if (basicStore.setSidebarOpenStatus && basicStore.sidebarName === 'chat') {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    return;
  }

  basicStore.setSidebarOpenStatus(true);
  basicStore.setSidebarName('chat');
}
</script>

<style lang="scss" scoped>

</style>
