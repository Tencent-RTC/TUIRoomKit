<template>
  <div class="more-control-container">
    <icon-button
      :is-active="sidebarName === 'more'"
      :title="t('More')"
      :icon-name="iconName"
      @click-icon="showMore"
    />
  </div>
  <div v-if="showMoreContent" class="show-more-content">
    <div class="control-compent">
      <chat-control
        v-if="roomStore.isSpeakAfterTakingSeatMode"
        @click="handleControlClick('chatControl')"
      ></chat-control>
      <contact-control @click="handleControlClick('contactControl')"></contact-control>
      <invite-control @click="handleControlClick('inviteControl')"></invite-control>
    </div>
    <div class="close" @click="showMoreContent=false">
      <i>{{ t('Cancel') }}</i>
    </div>
  </div>
</template>
<script setup lang="ts">
import IconButton from '../../common/IconButton.vue';
import userMoreControl from './useMoreControlHooks';
import ChatControl from '../ChatControl.vue';
import InviteControl from '../InviteControl.vue';
import ContactControl from '../ContactControl.vue';
import { useRoomStore } from '../../../stores/room';
import { ref } from 'vue';
import bus from '../../../hooks/useMitt';
import TUIRoomAegis from '../../../utils/aegis';


const showMoreContent = ref(false);

const {
  t,
  iconName,
  sidebarName,
} = userMoreControl();
const roomStore = useRoomStore();

function showMore() {
  showMoreContent.value = true;
}
function handleControlClick(name: string) {
  TUIRoomAegis.reportEvent({ name, ext1: name });
  bus.emit('experience-communication', name);
}
</script>
<style lang="scss" scoped>
.show-more-content{
    position: absolute;
    bottom: 15px;
    width: 90%;
    height: 20vh;
    background: var(--log-out-cancel);
    border-radius: 13px;
    padding: 10px;
    animation-duration: 100ms;
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
}
.close{
    background: var(--log-out);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    i{
     font-family: 'PingFang SC';
     font-style: normal;
     font-weight: 400;
     line-height: 24px;
     text-align: center;
    }
}
</style>
