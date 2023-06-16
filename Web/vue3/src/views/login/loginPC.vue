<template>
  <div class="login-page">
    <div class="login-user">
      <div class="avatar-icon">
        <svg-icon icon-name="avatar-icon" size="medium" style="width: 28px;height: 28px;"></svg-icon>
      </div>
      <div class="login-user-status">
        <span>{{ t('Sign in') }}</span>
      </div>
      <!-- 中英文切换 -->
      <language-icon class="language"></language-icon>
    </div>
    <div ref="loginImgRef" class="login-img">
      <img :src="loginBack">
    </div>
    <div ref="loginBoardContainerRef" class="login-board-container">
      <div class="login-board">
        <div ref="loginRef" class="login-sign-in">
          <img class="login-top" :src="logo">
          <div class="login-phone">
            <div class="tabs">
              <div
                class="tab"
                :class="{active:mode==MODE.PHONE_NUMBER}"
                @click="changeContent(MODE.PHONE_NUMBER)"
              >
                {{ t('Phone Login') }}
              </div>
              <div
                class="tab"
                :class="{active:mode==MODE.MAIL_ADDRESS}"
                @click="changeContent(MODE.MAIL_ADDRESS)"
              >
                {{ t('Email Login') }}
              </div>
            </div>
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
          <div class="login-button">
            <el-button type="primary" size="large" class="button" @click="handleLogin">{{ t('Login') }}</el-button>
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
import loginBack from '@/assets/imgs/login-back.png';

import SvgIcon from '../../TUIRoom/components/common/SvgIcon.vue';
import useLogin from './useLoginHooks';

const {
  loginRef,
  logo,
  isShowTerms,
  MODE,
  loginResults,
  verifyCodeListRef,
  loginImgRef,
  loginBoardContainerRef,
  mode,
  isPhoneNumberMode,
  isMailAddressMode,
  privacyGuide,
  userAgreement,
  t,
  changeContent,
  updatePhoneNumber,
  updateMailAddress,
  updateVerifyCode,
  sendVerifyCode,
  handleLogin,
} = useLogin();

function zoomScale() {
  const radioX = document.documentElement.clientWidth / 1440;
  const radioY = document.documentElement.clientHeight / 860;
  const radio = radioX < radioY ? radioX : radioY;

  const loginBoardContainerWidth = document.documentElement.clientWidth - (loginImgRef.value.clientWidth * radio);

  // 当预留的登录卡片宽度不足 430px 时，隐藏左侧的图片
  if (loginBoardContainerWidth < 430) {
    loginImgRef.value.style.visibility = 'hidden';
    loginBoardContainerRef.value.style.width = '100%';
    return;
  }

  loginImgRef.value.style.visibility = 'visible';
  loginImgRef.value.style.transform = `scale(${radio})`;
  loginBoardContainerRef.value.style.width = `${loginBoardContainerWidth}px`;
}
onMounted(() => {
  zoomScale();
  ['resize', 'pageshow'].forEach((item) => {
    window.addEventListener(item, zoomScale);
  });
});

onBeforeUnmount(() => {
  ['resize', 'pageshow'].forEach((item) => {
    window.removeEventListener(item, zoomScale);
  });
});


onMounted(() => {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://ssl.captcha.qq.com/TCaptcha.js';
  document.getElementsByTagName('head')[0].appendChild(script);
});

</script>

<style lang="scss" scoped>
  @import '../../TUIRoom/assets/style/element-custom.scss';
  html, body {
    height: 100%;
  }
  .login-page {
    background-color: #0D0F15;
    min-width: 1440px;
    min-height: 860px;
    height: 100%;
    background-color: #0D0F15;
    display: flex;
    align-items: center;
    .login-user{
      width: 160px;
      line-height: 22px;
      display: flex;
      flex-direction: row;
      position: absolute;
      left: 45px;
      top: 42px;
      .login-user-status{
        width: 70px;
        font-size: 16px;
        color: #CFD4E6;
        padding: 4px 0 0 0;
      }
      .avatar-icon{
        padding-right: 10px;
      }
      .language{
        width: 30px;
        height: 30px;
        cursor: pointer;
        z-index:1;
        padding-top: 2px;
      }
    }
  }
  .login-img {
    width: 888px;
    height: 818px;
    transform-origin: left center;
    img {
      width: 100%;
      height: 100%;
    }
  }
  .login-board-container {
    height: 100%;
    position: absolute;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .login-board {
    width: 430px;
    height: 610px;
    border-radius: 20px;
    position: relative;
    padding: 2px;
    background-image: linear-gradient(230deg, rgba(61,119,255,0.53), rgba(61,143,255,0) 50%);
  }
  .login-sign-in {
    width: 100%;
    height: 100%;
    border-radius: 20px;
    background: rgba(27, 30, 38, 0.9);
    padding-top: 63px;
  }
  .login-top,
  .login-phone,
  .login-protocol,
  .login-button {
    width:317.1px;
    margin:0 auto;
  }
  .login-top {
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translate(-50%);
  }
  .login-phone {
    height: 218px;
    margin-top:70px;
.tab{
  float: left;
  color:#fff;
  font-size:18px;
  font-weight:bold;
  cursor:pointer;
  margin-right:15px;
}
.tabs{
  margin-bottom:28px;
}
.tabs:after{
  content:'clear';
  display:block;
  height:0;
  clear:both;
  overflow:hidden;
  visibility:hidden;
}

.active:after{
  content: '';
  width: 36px;
  height: 2px;
  background: #006EFF;
  border-radius: 1px;
  display: block;
  margin-top: 5px;
  margin-left:18px;
}
.verify-code{
    margin-top:30px;
  }
  }
  .login-protocol {
    display: flex;
    margin-top:38px;
    line-height: 20px;
    color: #989EB3;
    .el-checkbox{
      height: 18px;
    }
    .tips{
      font-size: 14px;
      margin-left: 6px;
    }
  }
  .login-button {
    height:60px;
    // border: 1px solid pink;
    margin-top:22px;
  }
  .button{
    width:100%;
    height:100%;
    border-radius:4px;
    color:#fff;
    font-size:20px;
  }

  .login-page-mobile {
    min-width: 100%;
    min-height: 400px;
    .login-img {
      display: none;
    }
    .login-board {
      margin-left: 0;
    }
  }
</style>
