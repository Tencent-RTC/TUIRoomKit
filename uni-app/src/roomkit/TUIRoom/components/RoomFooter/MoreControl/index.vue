<template>
  <div>
    <div class="more-control-container">
      <icon-button
        :is-active="sidebarName === 'more'"
        :title="t('More')"
        icon="ExtensionIcon"
        @tap="showMore"
      />
    </div>
    <div v-if="showMoreContent" ref="moreContentRef" class="show-more-content">
      <div class="control-compent">
        <!-- <chat-control
          v-if="roomStore.isSpeakAfterTakingSeatMode"
          @click="handleControlClick('chatControl')"
        ></chat-control> -->
        <contact-control @click="handleControlClick('contactControl')"></contact-control>
        <invite-control @click="handleControlClick('inviteControl')"></invite-control>
      </div>
      <text class="close" @tap="handleCancelControl">{{ t('Cancel') }}</text>
    </div>
  </div>
</template>
<script setup lang="ts">
import IconButton from '../../common/base/IconButton.vue';
import userMoreControl from './useMoreControlHooks';
// import ChatControl from '../ChatControl.vue';
import InviteControl from '../InviteControl.vue';
import ContactControl from '../ContactControl.vue';
import { useRoomStore } from '../../../stores/room';
import { ref, onMounted, onUnmounted } from 'vue';
import bus from '../../../hooks/useMitt';
import TUIRoomAegis from '../../../utils/aegis';

const showMoreContent = ref(false);
const moreContentRef = ref();

const {
  t,
  sidebarName,
} = userMoreControl();
const roomStore = useRoomStore();

function showMore() {
  showMoreContent.value = true;
}

function handleCancelControl() {
  showMoreContent.value = false;
}
function handleControlClick(name: string) {
  TUIRoomAegis.reportEvent({ name, ext1: name });
  bus.emit('experience-communication', name);
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
.show-more-content{
    position: fixed;
    left: 0;
    bottom: 0;
    width: 750rpx;
    height: 150px;
    background-color: #FFFFFF;
    border-radius: 13px;
    padding: 10px;
    animation-duration: 200ms;
    animation-name: popup;
}
@keyframes popup{
  from {
    bottom: 0px;
  }
  to{
    bottom: 15px;
  }
}
.control-compent{
    display: flex;
		flex-direction: row;
}
.close {
    background: #006EFF;
    border-radius: 8px;
    border: 1px solid #006EFF;
    display: flex;
    width: 715rpx;
    align-items: center;
    justify-content: center;
    padding: 10px;
    color: #FFFFFF;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    text-align: center;
		justify-content: center;
		margin-top: 10px;
}
</style>
