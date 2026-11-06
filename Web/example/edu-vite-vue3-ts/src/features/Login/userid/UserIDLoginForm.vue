<template>
  <form class="login-form" @submit.prevent="submit">
    <LoginField label="UserID" :error="isLogin ? '' : errors.userID">
      <TUIInput
        v-model="form.userID"
        :disabled="isLogin"
        :status="errors.userID ? 'error' : 'default'"
        :placeholder="t('Login.UserIdPlaceholder')"
        @input="clearError(form.userID)"
      />
    </LoginField>
    <TUIButton class="login-submit" variant="primary" native-type="submit" block :disabled="isSubmitting">
      {{ submitText }}
    </TUIButton>
    <TUIButton v-if="isLogin" class="login-secondary" block @click="logout">
      {{ t('Login.SwitchAccount') }}
    </TUIButton>
    <LoginAgreement :checked="form.checked" :error="errors.check" @toggle="toggleAgreement" />
  </form>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUIButton, TUIInput, useI18n } from '@tencentcloud/roomkit-web-vue3';
import LoginAgreement from '../components/LoginAgreement.vue';
import LoginField from '../components/LoginField.vue';
import type { LoginHandler } from '../types';
import { useUserIDLogin } from './useUserIDLogin';

const props = defineProps<{
  sdkAppId: number;
  generateUserSig: (userID: string) => string | Promise<string>;
  onLogin: LoginHandler;
}>();

const { t } = useI18n();
const {
  form,
  errors,
  isLogin,
  isSubmitting,
  submit,
  toggleAgreement,
  clearError,
  logout,
} = useUserIDLogin(props.sdkAppId, props.generateUserSig, props.onLogin);

const submitText = computed(() => {
  if (isSubmitting.value) {
    return t('Login.Logging');
  }
  return isLogin.value ? t('Login.ConfirmLogin') : t('Login.Title');
});
</script>

<style lang="scss" scoped src="../styles/form.scss"></style>
