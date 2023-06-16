<template>
  <div class="login-page">
    <div class="language-container">
      <language-icon class="language"></language-icon>
    </div>
    <div v-if="!isEN" class="icon-container">
      <img :src="tencentCloud">
      <svg-icon
        class="icon" icon-name="tencent-cloud-text"
      ></svg-icon>
    </div>
    <div v-else class="login-logo">
      <img class="login-top" :src="logo">
    </div>
    <div ref="loginBoardContainerRef" class="login-board-container">
      <div class="login-board">
        <div ref="loginRef" class="login-sign-in">
          <div class="login-phone">
            <!-- content -->
            <div class="tab-content">
              <div v-show="isPhoneNumberMode">
                <phone-login @update-phone-number="updatePhoneNumber"></phone-login>
              </div>
              <div v-show="isMailAddressMode">
                <mail-login @update-mail-address="updateMailAddress"></mail-login>
              </div>
            </div>
            <div class="verify-code">
              <verify-code
                ref="verifyCodeListRef"
                @update-verify-code="updateVerifyCode"
                @send-verify-code="sendVerifyCode"
              ></verify-code>
            </div>
          </div>
          <div class="login-protocol">
            <el-checkbox v-model="loginResults.isAgreed" class="custom-element-class"></el-checkbox>
            <div class="tips">
              <span>{{ t('I have read and agree to the') }}</span>
              <el-link type="primary" :underline="false" target="_blank" :href="privacyGuide">
                《{{ t('Privacy Policy') }}》
              </el-link>
              <span v-show="isShowTerms">{{ t('and') }}</span>
              <el-link v-show="isShowTerms" type="primary" :underline="false" target="_blank" :href="userAgreement">
                《{{ t('Terms of Use') }}》
              </el-link>
            </div>
          </div>
          <div class="login-button" @click="handleLogin">
            <span class="button">{{ t('Login') }}</span>
          </div>
          <div class="tabs">
            <div
              class="tab"
              :class="{active:mode==MODE.PHONE_NUMBER}"
              @click="changeContent(MODE.PHONE_NUMBER)"
            >
              {{ t('Phone Login') }}
            </div>
            <i></i>
            <div
              class="tab"
              :class="{active:mode==MODE.MAIL_ADDRESS}"
              @click="changeContent(MODE.MAIL_ADDRESS)"
            >
              {{ t('Email Login') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import PhoneLogin from '@TUIRoom/components/RoomLogin/PhoneLogin.vue';
import VerifyCode from '@TUIRoom/components/RoomLogin/VerifyCode.vue';
import MailLogin from '@TUIRoom/components/RoomLogin/MailLogin.vue';
import LanguageIcon from '@/TUIRoom/components/base/Language.vue';
import tencentCloud from '../../TUIRoom/assets/icons/svg/tencent-cloud-white.svg';


import SvgIcon from '../../TUIRoom/components/common/SvgIcon.vue';
import useLogin from './useLoginHooks';

const {
  loginRef,
  isShowTerms,
  MODE,
  loginResults,
  verifyCodeListRef,
  loginBoardContainerRef,
  mode,
  isPhoneNumberMode,
  isMailAddressMode,
  privacyGuide,
  userAgreement,
  logo,
  isEN,
  t,
  changeContent,
  updatePhoneNumber,
  updateMailAddress,
  updateVerifyCode,
  sendVerifyCode,
  handleLogin,
} = useLogin();

onMounted(() => {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://ssl.captcha.qq.com/TCaptcha.js';
  document.getElementsByTagName('head')[0].appendChild(script);
});


</script>
<style scoped>
.login-page{
    width: 100vw;
    height: 100vh;
}
.language-container{
    display: flex;
    justify-content: end;
    padding-right: 20px;
    padding-top: 10px;
}
.tencent-cloud{
    width: 120px;
    height: 32px;
    background-size: cover;
}
.login-board-container{
    padding-top: 20%;
}
.login-sign-in{
    display: flex;
    flex-direction: column;
    align-items: center;
}
.login-phone{
    width: 90vw;
}
.login-button{
    display: flex;
    width: 90vw;
    justify-content: center;
    margin-top: 10px;
    background-image: linear-gradient(-45deg, #006EFF 0%, #0C59F2 100%);
    border-radius: 16px;
}
.button{
    padding: 10px;
    color: white;
}
.verify-code{
    padding-top: 15px;
}
.tabs{
    display:flex;
    margin-top: 5%;
    align-items: center;
}
.tab{
    padding:0 10px;
    color: #676C80;
}
.login-protocol{
    display: flex;
    padding-top: 5%;
}
i{
    border: 1px solid #676C80;
    height: 1rem
}
.tips{
    display: flex;
    align-items: center;
    padding-left: 5px;
}
.tencent-cloud-text{
    width: 169px !important;
    height: 27px !important;
    margin-top: 2%;
    background-size: cover !important;
}
.icon-container{
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20%;
}
.login-logo{
    display: flex;
    justify-content: center;
    padding-top: 20%;
}
.login-top{
  width: 70%;
}
</style>
