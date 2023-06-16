import router from '@/router';
import { checkNumber } from '@/TUIRoom/utils/common';
import i18n from '@/TUIRoom/locales/index';
import Cookies from '@/TUIRoom/utils/common/cookieStorage.js';
import { useI18n } from 'vue-i18n';
import {
  getVerifyCode,
  verifyCodeLogin,
} from '../../api/http';

import { useRoute } from 'vue-router';
import { isInnerScene } from '../../TUIRoom/utils/constants';
import { computed, ref, reactive } from 'vue';
import logoCn from '@/assets/imgs/logo.png';
import logoEn from '@/assets/imgs/logo-en.png';
export default function useLogin() {
  const privacyGuideEn = 'https://www.tencentcloud.com/document/product/301/17345?lang=en&pg=';
  const privacyGuideCn = 'https://web.sdk.qcloud.com/document/Tencent-RTC-Privacy-Protection-Guidelines.html';
  const privacyGuide = computed(() => (i18n.global.locale.value === 'en-US' ? privacyGuideEn : privacyGuideCn));
  const userAgreement = 'https://web.sdk.qcloud.com/document/Tencent-RTC-User-Agreement.html';
  const MODE = {
    PHONE_NUMBER: 'phone_number',
    MAIL_ADDRESS: 'mail_address',
  };
  const loginRef = ref();
  const loginImgRef = ref();
  const loginBoardContainerRef = ref();
  const mode = ref(MODE.PHONE_NUMBER);
  const current = reactive({ mode });
  const verifyCodeListRef = ref();
  const route = useRoute();
  const emailReg = /^[\da-z]+([\\-\\.\\_]?[\da-z]+)*@[\da-z]+([\\-\\.]?[\da-z]+)*(\.[a-z]{2,})+$/i;
  const logo = computed(() => (i18n.global.locale.value === 'en-US' ? logoEn : logoCn));
  const isEN = computed(() => i18n.global.locale.value === 'en-US');
  const roomId = checkNumber((route.query.roomId) as string) ? route.query.roomId : '';
  const isShowTerms = computed(() => (i18n.global.locale.value !== 'en-US'));
  const { t } = useI18n();

  const sdkAppId = isInnerScene ? 1400704311 : 1400188366;
  const userInfoStorage = localStorage.getItem(`tuiRoom-${sdkAppId}-userInfo`);
  interface LoginResults{
    privacyGuide: string;
    userAgreement: string;
    mode:string;
    isAgreed: boolean;
    phoneNumber: string;
    mailAddress: string;
    verifyCode: string;
    sessionId: string;
  }
  const loginResults:LoginResults = reactive({
    privacyGuide,
    userAgreement,
    mode: MODE.PHONE_NUMBER,
    isAgreed: false,
    phoneNumber: '',
    mailAddress: '',
    verifyCode: '',
    sessionId: '',
  });
  if (Cookies.get('tuiRoom-token') && userInfoStorage) {
    router.push({ path: 'home' });
  }

  function changeContent(value: string) {
    current.mode = value;
    verifyCodeListRef.value.clear();
  }

  const isPhoneNumberMode = computed(() => mode.value === MODE.PHONE_NUMBER);

  const isMailAddressMode = computed(() => mode.value === MODE.MAIL_ADDRESS);
  function updatePhoneNumber(value:string) {
    loginResults.phoneNumber = value;
  }
  function updateMailAddress(value:string) {
    loginResults.mailAddress = value;
  }
  // 用户点击【发送验证码】按钮
  function sendVerifyCode() {
    if (isPhoneNumberMode.value && !/^1[3|4|5|7|8|6|9][0-9]\d{8}$/.test(loginResults.phoneNumber)) {
      alert('请输入正确的手机号！');
      return;
    }
    if (isMailAddressMode.value && !emailReg.test(loginResults.mailAddress)) {
      alert('请输入正确的邮箱地址！');
      return;
    }
    // 图片验证web端接入文档：https://cloud.tencent.com/document/product/1110/36841
    // eslint-disable-next-line no-undef
    const captcha = new TencentCaptcha('2079625916', (res: any) => {
      if (res.ret === 0) {
        const { appid, ticket, randstr } = res;
        doSendVerifyCode(appid, ticket, randstr);
      }
    });
    captcha.show();
  }
  // 向后台请求发送验证码
  async function doSendVerifyCode(appid: string, ticket: string, randstr: string) {
    const params = {
      areaCode: isPhoneNumberMode.value ? '86' : '',
      phoneNumber: isPhoneNumberMode.value ? loginResults.phoneNumber : '',
      mailAddress: isMailAddressMode.value ? loginResults.mailAddress : '',
      appId: appid,
      ticket,
      randstr,
    };
    const smsCaptchaData = await getVerifyCode(params);
    loginResults.sessionId = smsCaptchaData.data.data.sessionId;
    console.warn('login.vue doSendVerifyCode', loginResults.sessionId);
    // 倒计时
    verifyCodeListRef.value.startCountDown();
  }
  function updateVerifyCode(value: string) {
    loginResults.verifyCode = value;
  }
  // 用户点击【登录】按钮
  function handleLogin() {
    if (isPhoneNumberMode.value && loginResults.phoneNumber === '') {
      alert('请输入手机号！');
      return;
    }
    if (isMailAddressMode.value && loginResults.mailAddress === '') {
      alert('请输入邮箱地址！');
      return;
    }
    if (loginResults.verifyCode === '') {
      alert('请输入验证码！');
      return;
    }
    if (!loginResults.isAgreed) {
      alert('请同意隐私协议及用户协议！');
      return;
    }
    doLogin();
  }
  // 请求登录接口
  async function doLogin() {
    const params = {
      areaCode: isMailAddressMode.value ? '' : '86',
      phoneNumber: isPhoneNumberMode.value ? loginResults.phoneNumber : '',
      mailAddress: isMailAddressMode.value ? loginResults.mailAddress : '',
      sessionId: loginResults.sessionId,
      verifyCode: loginResults.verifyCode,
    };
    console.log(params);
    const loginResult = await verifyCodeLogin(params);
    console.log(loginResult);
    switch (loginResult.data.errorCode) {
      case 0:
        handleLoginSuccess(loginResult.data.data);
        break;
      case 200:
        alert('验证码错误，请检查验证码！');
        break;
      case 201:
        alert('验证码已过期，请重新获取验证码！');
        break;
      case 202:
        alert('验证码已使用，请重新获取验证码！');
        break;
      default:
        alert('登录失败，请重试');
        break;
    }
  }
  function handleLoginSuccess(result:
  { sdkAppId: any; sdkUserSig: any; userId: any; avatar: any; name: any; token: any; }) {
    const { sdkAppId, sdkUserSig, userId, avatar, name, token } = result;
    const userInfo = JSON.stringify({
      sdkAppId,
      userSig: sdkUserSig,
      userId,
      userName: name,
      userAvatar: avatar,
    });
    localStorage.setItem(`tuiRoom-${sdkAppId}-userInfo`, userInfo);
    Cookies.set('tuiRoom-token', token, { expires: 30 });
    const newRoute = { path: '/home' };
    if (roomId) {
      Object.assign(newRoute, { query: { roomId } });
    }
    router.push(newRoute);
  }
  return {
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
    isEN,
    t,
    changeContent,
    sendVerifyCode,
    updatePhoneNumber,
    updateMailAddress,
    updateVerifyCode,
    handleLogin,
  };
}
