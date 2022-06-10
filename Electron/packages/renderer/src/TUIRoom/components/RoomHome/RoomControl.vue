<template>
  <div class="control-container">
    <div class="control-content">
      <img class="logo" :src="logo">
      <!-- query 中存在 roomId -->
      <div v-if="hasGivenRoomId" class="control-region">
        <span class="invite-title">是否进入房间？</span>
        <span class="invite-info">{{ `您被邀请进入 ${givenRoomId} 房间` }}</span>
        <div class="button enter-given-room-button" @click="enterGivenRoom">
          <span class="title">确定进入</span>
        </div>
      </div>
      <!-- query 中没有 roomId -->
      <div v-else class="control-region">
        <div class="button create-room-button" type="primary" @click="createRoom">
          <svg-icon icon-name="add-icon"></svg-icon>
          <span class="title">新建房间</span>
        </div>
        <div class="button join-room-button" type="primary" @click="enterRoom">
          <input v-model="roomId" class="input" placeholder="输入房间号" maxlength="10" @click.stop="">
          <span class="title">进入房间</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import logo from '../../assets/imgs/logo.png';
import SvgIcon from '../common/SvgIcon.vue';

const props = defineProps<{
  givenRoomId: string | null,
}>();

const hasGivenRoomId = typeof props.givenRoomId === 'string' && props.givenRoomId !== '';

const roomId = ref('');

watch(roomId, (val) => {
  roomId.value = val.replace(/[^\d]/g, '');
});

const emit = defineEmits(['createRoom', 'enterRoom']);

function enterGivenRoom() {
  emit('enterRoom', props.givenRoomId);
}

function createRoom() {
  emit('createRoom');
}

function enterRoom() {
  if (!roomId.value) {
    return;
  }
  emit('enterRoom', Number(roomId.value));
}

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

.control-container {
  width: 430px;
  height: 476px;
  border-radius: 20px;
  margin-left: 40px;
  position: relative;
  padding: 2px;
  background-image: linear-gradient(230deg, rgba(61,119,255,0.53), rgba(61,143,255,0) 50%);
  .control-content {
    width: 100%;
    height: 100%;
    padding: 0 40px;
    border-radius: 20px;
    background: rgba(27, 30, 38, 0.9);
  }
  .logo {
    position: absolute;
    top: 78px;
    left: 50%;
    width: 318px;
    height: 42px;
    transform: translate(-50%);
  }
  .control-region {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
  }
  .invite-title {
    display: inline-block;
    font-weight: 500;
    font-size: 28px;
    color: $whiteColor;
    line-height: 34px;
    position: absolute;
    top: 183px;
  }
  .invite-info {
    display: inline-block;
    font-weight: 400;
    font-size: 20px;
    color: $whiteColor;
    opacity: 0.6;
    line-height: 34px;
    position: absolute;
    top: 232px;
  }
  .button {
    width: 360px;
    height: 88px;
    background-image: linear-gradient(-45deg, #006EFF 0%, #0C59F2 100%);
    box-shadow: 0 2px 4px 0 rgba(0,0,0,0.20);
    border-radius: 8px;
    padding: 2px;
    cursor: pointer;
    .title {
      font-size: 22px;
      color: #FFFFFF;
      line-height: 34px;
      margin-left: 9px;
    }
  }

  .enter-given-room-button {
    position: absolute;
    top: 338px;
    text-align: center;
    line-height: 88px;
  }

  .create-room-button {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 214px;
  }

  .join-room-button {
    position: absolute;
    bottom: 50px;
    .input {
      width: 212px;
      height: 100%;
      background: rgba(27,30,38,0.90);
      border-color: transparent;
      outline: none;
      border-radius: 8px;
      font-weight: 400;
      font-size: 22px;
      color: #676C80;
      line-height: 34px;
      padding: 0 20px;
    }
    .title {
      margin-left: 28px;
      cursor: pointer;
    }
  }
}
</style>
