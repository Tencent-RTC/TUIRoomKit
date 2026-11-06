<template>
  <div class="login-agreement">
    <TUICheckbox class="login-agreement-check" :model-value="checked" @change="emit('toggle')">
      {{ t('Login.AgreementPrefix') }}
      <a class="login-agreement-link" :href="PRIVACY_URL">{{ t('Login.PrivacyPolicy') }}</a>
      {{ t('Login.And') }}
      <a class="login-agreement-link" :href="USER_AGREEMENT_URL">{{ t('Login.UserAgreement') }}</a>
    </TUICheckbox>
    <span v-if="error" class="login-agreement-error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { TUICheckbox, useI18n } from '@tencentcloud/roomkit-web-vue3';

defineProps<{
  checked: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const PRIVACY_URL = 'https://web.sdk.qcloud.com/document/Tencent-IM-Privacy-Protection-Guidelines.html';
const USER_AGREEMENT_URL = 'https://web.sdk.qcloud.com/document/Tencent-IM-User-Agreement.html';

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.login-agreement {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  font-size: var(--rk-fs-sm);
  line-height: 18px;
  color: var(--rk-text-tertiary);

  /* Top-aligned so the box stays on the first line when the text wraps */
  .login-agreement-check {
    align-items: flex-start;
    font-size: inherit;
    line-height: inherit;

    :deep(.rk-checkbox-box) {
      width: 14px;
      height: 14px;
      margin-top: 2px;
    }
  }
}

.login-agreement-error {
  color: var(--rk-danger);
}

.login-agreement-link {
  color: var(--rk-brand);
  text-decoration: none;

  &:hover {
    color: var(--rk-brand-hover);
  }
}
</style>
