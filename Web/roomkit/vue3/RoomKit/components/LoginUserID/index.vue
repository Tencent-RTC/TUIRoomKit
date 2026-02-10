<template>
  <div class="login-userid-container">
    <form class="login-form" @submit.prevent="submitForm">
      <template v-if="isLogin">
        <div class="form-group">
          <div class="form-row">
            <label for="userid">userID</label>
            <div class="input-container">
              <input
                id="userid"
                v-model="userInfo.userID"
                type="text"
                disabled
                class="input-field"
                autocomplete="off"
              >
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="form-group">
          <div class="form-row">
            <label for="userid">userID</label>
            <div class="input-container">
              <input
                id="userid"
                v-model="userInfo.userID"
                type="text"
                class="input-field"
                :class="{ 'input-error': error.userID }"
                :placeholder="t('Please enter userID')"
                autocomplete="off"
              >
              <span v-if="error.userID" class="error-text">{{ error.userID }}</span>
            </div>
          </div>
        </div>
      </template>

      <TUIButton type="primary" class="submit-button">
        {{ isLogin ? t('Confirm Login') : t('Login') }}
      </TUIButton>
    </form>

    <TUIButton
      v-if="isLogin"
      class="submit-button"
      @click="logout"
    >
      {{ t('Switch Account') }}
    </TUIButton>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { TUIButton, useUIKit, TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();

export interface UserInfo {
  userID: string;
  userSig: string;
}

export interface LoginInfo {
  SDKAppID: number;
  userID: string;
  userSig: string;
  useUploadPlugin?: boolean;
  framework?: string;
  [key: string]: unknown;
}

export interface LoginProps {
  SDKAppID: number;
  className?: string;
  onLoginCallback?: (res: LoginInfo) => void;
  generatorUserSig?: (userID: string) => string;
}

const props = defineProps<LoginProps>();

const error = reactive({ userID: '', check: '' });

const userInfo = ref<UserInfo>({
  userID: '',
  userSig: '',
});

const isLogin = ref<boolean>(false);

const currentUserInfo = localStorage.getItem(`Login-userInfo-${props.SDKAppID}`);
if (currentUserInfo) {
  try {
    const storedUserInfo = JSON.parse(currentUserInfo);
    if (storedUserInfo.SDKAppID === props.SDKAppID) {
      userInfo.value.userID = storedUserInfo.userID;
      isLogin.value = true;
    }
  } catch (_e) {
    localStorage.removeItem(`Login-userInfo-${props.SDKAppID}`);
  }
}

const setUserInfo = (info: UserInfo) => {
  Object.assign(userInfo, info);
};

const login = (loginInfo: LoginInfo) => {
  setUserInfo({
    userID: loginInfo.userID,
    userSig: loginInfo.userSig,
  });
  localStorage.setItem(`Login-userInfo-${props.SDKAppID}`, JSON.stringify({
    SDKAppID: loginInfo.SDKAppID,
    userID: loginInfo.userID,
  }));
  if (props.onLoginCallback) {
    props.onLoginCallback(loginInfo);
  }
  isLogin.value = true;
};

const logout = () => {
  localStorage.removeItem(`Login-userInfo-${props.SDKAppID}`);
  setUserInfo({
    userID: '',
    userSig: '',
  });
  isLogin.value = false;
};

const handleLogin = (loginUserInfo?: UserInfo) => {
  const loginInfo: LoginInfo = {
    SDKAppID: props.SDKAppID,
    userID: loginUserInfo?.userID || '',
    userSig: loginUserInfo?.userSig || '',
    useUploadPlugin: true,
    framework: 'vue',
  };
  login(loginInfo);
};

const submitForm = (): void => {
  if (!props.SDKAppID) {
    TUIToast({
      type: TOAST_TYPE.ERROR,
      message: t('Please configure SDKAPPID'),
    });
    return;
  }
  if (!userInfo.value.userID) {
    TUIToast({
      type: TOAST_TYPE.ERROR,
      message: t('Please enter a valid userID'),
    });
    return;
  }
  if (!props.generatorUserSig) {
    TUIToast({
      type: TOAST_TYPE.ERROR,
      message: t('Please provide a function to generate userSig'),
    });
    return;
  }

  handleLogin({
    userID: userInfo.value.userID,
    userSig: props.generatorUserSig(userInfo.value.userID) || '',
  });
};
</script>

<style scoped>
.login-userid-container {
  max-width: 480px;
  margin: 2rem auto;
  padding: 30px 15px;
  background-color: #1c1c1c;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.login-form {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  align-items: center;
}

label {
  width: 60px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  text-align: right;
  padding-right: 15px;
  flex-shrink: 0;
}

.input-container {
  flex: 1;
}

.input-field {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #333;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
  height: 46px;
  transition: all 0.3s ease;
  color: #fff;
  background-color: #2c2c2c;
  line-height: 22px;
}

.input-field:focus {
  outline: none;
  border-color: #1890ff;
  background-color: #2c2c2c;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.input-field::placeholder {
  color: rgba(255, 255, 255, 0.45);
  font-size: 14px;
}

.input-error {
  border-color: #ff4d4f;
}

.input-error:focus {
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1);
}

.error-text {
  display: block;
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 6px;
}

.checkbox-container {
  justify-content: center;
}

.checkbox-group {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.checkbox-error {
  color: #ff4d4f;
}

.checkbox-label {
  display: inline;
  margin-left: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  width: auto;
  text-align: left;
  padding-right: 0;
  line-height: 1.4;
}

.submit-button {
  width: 100%;
}

.icon-container {
  color: #fff;
}
</style>
