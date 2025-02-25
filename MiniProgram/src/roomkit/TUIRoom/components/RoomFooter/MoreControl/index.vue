<template>
  <div>
    <div v-if="moreControlConfig.visible" class="more-control-container">
      <icon-button
        @tap="showMore"
        :is-active="sidebarName === 'more'"
        :title="t('More')"
        :icon="ExtensionIcon"
      />
    </div>
    <div v-if="showMoreContent" ref="moreContentRef" class="show-more-content">
      <div class="control-compent">
        <chat-control
          v-if="roomStore.isSpeakAfterTakingSeatMode"
          @click="handleControlClick('chatControl')"
        />
        <contact-control @click="handleControlClick('contactControl')" />
        <invite-control
          @show-overlay="handleShowOverlay"
          @click="handleControlClick('inviteControl')"
        />
      </div>
      <div @tap="handleCancelControl" class="close">{{ t('Cancel') }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineEmits } from 'vue';
import IconButton from '../../common/base/IconButton.vue';
import userMoreControl from './useMoreControlHooks';
import ChatControl from '../ChatControl.vue';
import InviteControl from '../InviteControl.vue';
import ContactControl from '../ContactControl.vue';
import { useRoomStore } from '../../../stores/room';
import ExtensionIcon from '../../../assets/icons/ExtensionIcon.svg';
import bus from '../../../hooks/useMitt';
import { roomService } from '../../../services';

const moreControlConfig = roomService.getComponentConfig('MoreControl');
const showMoreContent = ref(false);
const moreContentRef = ref();

const { t, sidebarName } = userMoreControl();
const roomStore = useRoomStore();
const emit = defineEmits(['show-overlay']);
function showMore() {
  showMoreContent.value = true;
}

function handleCancelControl() {
  showMoreContent.value = false;
}
function handleControlClick(name: string) {
  bus.emit('experience-communication', name);
}

function handleShowOverlay(data: { name: string; visible: boolean }) {
  showMoreContent.value = false;
  emit('show-overlay', data);
}

function handleDocumentClick(event: MouseEvent) {
  if (showMoreContent.value && !moreContentRef.value.contains(event.target)) {
    showMoreContent.value = false;
  }
}

onMounted(() => {
  document?.addEventListener('click', handleDocumentClick, true);
});

onUnmounted(() => {
  document?.removeEventListener('click', handleDocumentClick, true);
});
</script>
<style lang="scss" scoped>
.show-more-content {
  position: absolute;
  bottom: 15px;
  left: 5%;
  width: 90%;
  height: 17vh;
  padding: 10px;
  border-radius: 13px;
  animation-name: popup;
  animation-duration: 200ms;
  background-color: var(--bg-color-operate);
}

@keyframes popup {
  from {
    bottom: 0;
  }

  to {
    bottom: 15px;
  }
}

.control-compent {
  display: flex;
}

.close {
  position: relative;
  top: 10%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  text-align: center;
  border-radius: 8px;
  color: var(--text-color-primary);
  background-color: var(--button-color-secondary-default);
}
</style>
