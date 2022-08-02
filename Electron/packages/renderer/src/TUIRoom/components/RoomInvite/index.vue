<template>
  <div class="invite-container">
    <div class="invite-notice">您可以通过复制房间号或者邀请链接的方式邀请更多人加入房间</div>
    <div class="invite-content">
      <div class="invite-item">
        <span class="invite-title">通过房间号邀请</span>
        <div class="input-area">
          <input class="input" type="text" :value="roomId">
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(roomId)"></svg-icon>
        </div>
      </div>
      <div class="invite-item" v-if="roomLinkDisplay">
        <span class="invite-title">通过房间链接邀请</span>
        <div class="input-area">
          <input class="input" type="text" :value="inviteLink">
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(inviteLink)"></svg-icon>
        </div>
      </div>
      <div class="invite-item">
        <span class="invite-title">通过客户端 scheme 邀请</span>
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

const roomLinkDisplay = ref(true);

const basicStore = useBasicStore();
const { roomId } = storeToRefs(basicStore);

const { origin, pathname } = location;

onMounted(() => {
  if ((window as any).__TRTCElectron) {
    roomLinkDisplay.value = false; 
  }
})


const inviteLink = computed(() => {
  return `${origin}${pathname}#/home?roomId=${roomId.value}`;
});

const schemeLink = computed(() => {
  return `tuiroom://joinroom?roomId=${roomId.value}`;
});

function onCopy(value: string | number) {
  navigator.clipboard.writeText(`${value}`);
  ElMessage({
    message: '复制成功',
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
