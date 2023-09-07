<template>
  <div class="chat-control-container">
    <div v-if="isMobile">
      <div
        v-if="chatStore.unReadCount > 0"
        class="count"
      >
        <icon-button
          @tap="toggleChatSidebar"
          :title="t('Chat')"
          :icon-name="iconName"
        />
        <span class="unreadCount">{{ chatStore.unReadCount > 10 ? '10+' : chatStore.unReadCount }}</span>
      </div>
      <icon-button
        v-else
        @tap="toggleChatSidebar"
        :is-active="sidebarName === 'chat'"
        :title="t('Chat')"
        :icon-name="iconName"
      />
    </div>
    <div v-else>
      <el-badge
        v-if="chatStore.unReadCount > 0"
        :value="chatStore.unReadCount > 10 ? '10+' : chatStore.unReadCount"
      >
        <icon-button
          :title="t('Chat')"
          :icon-name="iconName"
          @click-icon="toggleChatSidebar"
        />
      </el-badge>
      <icon-button
        v-else
        :is-active="sidebarName === 'chat'"
        :title="t('Chat')"
        :icon-name="iconName"
        @click-icon="toggleChatSidebar"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IconButton from '../common/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from '../../locales';
import { isMobile } from '../../utils/useMediaValue';
const { t } = useI18n();

const basicStore = useBasicStore();
const chatStore = useChatStore();
const { sidebarName } = storeToRefs(basicStore);

const iconName = computed(() => (sidebarName.value === 'chat' ? ICON_NAME.ChatActive : ICON_NAME.Chat));

async function toggleChatSidebar() {
  if (basicStore.setSidebarOpenStatus && basicStore.sidebarName === 'chat') {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    return;
  }
  basicStore.setSidebarOpenStatus(true);
  basicStore.setSidebarName('chat');
  chatStore.updateUnReadCount(0);
}

</script>

<style lang="scss" >
.chat-control-container .el-badge .el-badge__content {
  top: 14px;
  right: 24px;
  background-color: #006EFF;
}
.count{
  display: flex;
}
.unreadCount{
  background-color: #006eff;
  min-width: 20px;
  height: 20px;
  text-align: center;
  color: white;
  position: relative;
  left: -20px;
  top: 4px;
  padding: 2px;
  border-radius:45px;
}
</style>
