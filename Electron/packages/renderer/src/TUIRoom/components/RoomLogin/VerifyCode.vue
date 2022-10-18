<template>
  <div class="verify-input">
    <input v-model="verifyStates.verifyCode" class="input" :placeholder="t('Verification code')">
    <div class="area-container">
      <svg-icon icon-name="verify-code" size="medium"></svg-icon>
    </div>
    <span v-if="verifyStates.countdown <= 0" class="text send-btn" @click="sendVerifyCode">{{ t('SEND') }}</span>
    <span v-else class="text static"> {{ t('') }} {{ `${verifyStates.countdown} s` }}</span>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import SvgIcon from '../common/SvgIcon.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const emit = defineEmits(['updateVerifyCode', 'sendVerifyCode']);
interface VerifyStates{
  countdown: number,
  timer: number,
  verifyCode: string,
}
const verifyStates:VerifyStates = reactive({
  countdown: 0,
  timer: 0,
  verifyCode: '',
});
watch(() => verifyStates.verifyCode, (val) => {
  verifyStates.verifyCode = val.replace(/\D/g, '');
  /**
   * Get the verification code
   *
   * 获取到验证码
  **/
  emit('updateVerifyCode', verifyStates.verifyCode);
});
function startCountDown() {
  verifyStates.countdown = 60;
  verifyStates.timer = window.setInterval(() => {
    verifyStates.countdown = verifyStates.countdown - 1;
    if (verifyStates.countdown <= 0) {
      clearInterval(verifyStates.timer);
    }
  }, 1000);
}
function sendVerifyCode() {
  emit('sendVerifyCode');
}

function clear() {
  verifyStates.countdown = 0;
}

defineExpose({ startCountDown, clear });

</script>

<style lang="scss" scoped>
.verify-input{
    position:relative;
    width:100%;
    height:100%;
    .input{
        -webkit-appearance:none;
        background-color:#292D38;
        background-image:none;
        border-radius:8px;
        border:1px solid #292D38;
        box-sizing:border-box;
        color: #B3B8C8;
        display:inline-block;
        font-size:inherit;
        height:60px;
        line-height:60px;
        outline:none;
        padding:0 15px 0 40px;
        transition:border-color .2s cubic-bezier(.645,.045,.355,1);
        width:100%;
    }
    .area-container {
        width:20px;
        height:20px;
        // border: 1px solid pink;
        position:absolute;
        top:32%;
        left:4%;
    }
    .text{
      height: 60px;
      line-height: 60px;
      position: absolute;
      right: 12px;
      font-size: 18px;
      // border:1px solid #000;
        &.send-btn{
            cursor:pointer;
            color:#4791FF;
            font-size: 16px;
        }
        &.static{
            color:#ccc;
            opacity:0.5;
        }
    }

}
</style>
