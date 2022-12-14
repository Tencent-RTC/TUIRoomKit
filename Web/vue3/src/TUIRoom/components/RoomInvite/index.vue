<template>
  <div class="invite-container">
    <div class="invite-notice">{{ t('Share the room ID or invite link') }}</div>
    <div class="invite-content">
      <div class="invite-item">
        <span class="invite-title">{{ t('Invite by room number') }}</span>
        <div class="input-area">
          <input class="input" type="text" :value="roomId">
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(roomId)"></svg-icon>
        </div>
      </div>
      <div v-if="roomLinkDisplay" class="invite-item">
        <span class="invite-title">{{ t('Invite via room link') }}</span>
        <div class="input-area">
          <input class="input" type="text" :value="inviteLink">
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(inviteLink)"></svg-icon>
        </div>
      </div>
      <div class="invite-item">
        <span class="invite-title">{{ t('Invite via client scheme') }}</span>
        <div class="input-area">
          <input class="input" type="text" :value="schemeLink">
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(schemeLink)"></svg-icon>
        </div>
      </div>
    </div>
    <!-- <div>允许访客通过链接进入房间</div> -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useBasicStore } from '../../stores/basic';
import { ElMessage } from 'element-plus';
import { storeToRefs } from 'pinia';
import SvgIcon from '../common/SvgIcon.vue';
import { useI18n } from 'vue-i18n';

import { isElectronEnv } from '../../utils/utils';

const { t } = useI18n();

const roomLinkDisplay = ref(true);

const basicStore = useBasicStore();
const { roomId } = storeToRefs(basicStore);

const { origin, pathname } = location;
const isElectron = isElectronEnv();

onMounted(() => {
  // eslint-disable-next-line no-underscore-dangle
  if ((window as any).__TRTCElectron) {
    roomLinkDisplay.value = false;
  }
});

let inviteLink = computed(() => `${origin}${pathname}#/home?roomId=${roomId.value}`);
if(isElectron) {
  inviteLink = computed(
    () => `https://web.sdk.qcloud.com/trtc/webrtc/test/xinli-test/tuiroom-wasm/index.html#home?roomId=${roomId.value}`
  );
}

// todo: schema 唤起
const schemeLink = computed(() => `tuiroom://joinroom?roomId=${roomId.value}`);

function onCopy(value: string | number) {
  navigator.clipboard.writeText(`${value}`);
  ElMessage({
    message: t('Copied successfully'),
    type: 'success',
  });
}
</script>

<style lang="scss" scoped>
.invite-container{
  padding: 20px 32px;
}
.invite-notice{
  font-size: 14px;
  width: 100%;
  height: 22px;
  line-height: 22px;
  font-weight: 400;
  color: #7C85A6;
  font-family: PingFangSC-Regular;
}
.invite-content{
  width: 100%;
  margin-top: 20px;
  .invite-item {
    &:not(:first-child) {
      margin-top: 20px;
    }
    .invite-title {
      font-size: 14px;
      color: #CFD4E6;
      width: 100%;
    }
    .input-area {
      margin-top: 10px;
      position: relative;
      .input{
        -webkit-appearance: none;
          background-color: #2E323D;
          background-image: none;
          border-radius: 2px;
          border: 1px solid #2E323D;
          box-sizing: border-box;
          color: #7C85A6;
          display: inline-block;
          font-size: 14px;
          height: 32px;
          line-height: 32px;
          outline: none;
          padding: 0 40px 0 10px;
          transition: border-color .2s cubic-bezier(.645,.045,.355,1);
          width: 416px;
      }
      .copy {
        width: 14px;
        height: 14px;
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        cursor: pointer;
      }
    }
  }
}
</style>
