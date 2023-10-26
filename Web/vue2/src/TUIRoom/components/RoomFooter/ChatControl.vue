<template>
  <div class="chat-control-container">
    <div v-if="isMobile">
      <div
        class="count"
      >
        <icon-button
          v-tap="toggleChatSidebar"
          class="chat-icon-box"
          :is-active="sidebarName === 'chat'"
          :title="t('Chat')"
          :icon-name="iconName"
        />
        <span
          v-if="chatStore.unReadCount > 0"
          class="unreadCount"
        >{{ chatStore.unReadCount > 10 ? '10+' : chatStore.unReadCount }}</span>
      </div>
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
import '../../directives/vTap';
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
  position: relative;
}
.unreadCount{
  background-color: #006eff;
  color: white;
  font-size: 12px;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  line-height: 20px;
  color: white;
  position: absolute;
  right: 0px;
  top: 4px;
  border-radius: 50%;
  padding: 11px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.chat-icon-box{
  height: 100%;
}
</style>
