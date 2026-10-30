<template>
  <RoomKitProvider class="preclass-mobile-root" scene="education">
    <div class="preclass-mobile">
      <h1 class="preclass-mobile-title">
        {{ t('Home.Title') }}
      </h1>

      <section v-if="role === 'teacher'" class="preclass-mobile-card">
        <h2 class="preclass-mobile-card-title">
          {{ t('Home.Teacher') }}
        </h2>
        <TUIButton variant="primary" block @click="emit('create')">
          {{ t('Home.StartClass') }}
        </TUIButton>
      </section>

      <section class="preclass-mobile-card">
        <h2 class="preclass-mobile-card-title">
          {{ t('Home.Student') }}
        </h2>
        <TUIInput
          :model-value="classId"
          :placeholder="t('Home.ClassIdPlaceholder')"
          :status="errorKey ? 'error' : 'default'"
          @update:model-value="onClassIdInput"
          @enter="joinClass"
        />
        <p v-if="errorKey" class="preclass-mobile-error">
          {{ t(errorKey) }}
        </p>
        <TUIButton variant="primary" block :disabled="!classId" @click="joinClass">
          {{ t('Home.JoinClass') }}
        </TUIButton>
      </section>

      <TUIButton class="preclass-mobile-logout" variant="ghost" @click="emit('logout')">
        {{ t('Home.Logout') }}
      </TUIButton>
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RoomKitProvider, TUIButton, TUIInput, t } from '@tencentcloud/roomkit-web-vue3';
import type { ClassRole } from '../types';

defineProps<{
  role: ClassRole;
}>();

const emit = defineEmits<{
  create: [];
  join: [roomId: string];
  logout: [];
}>();

const classId = ref('');
const errorKey = ref('');

function onClassIdInput(value: string | number | null) {
  classId.value = String(value ?? '').trim();
  errorKey.value = '';
}

function joinClass() {
  if (!/^\d+$/.test(classId.value)) {
    errorKey.value = 'Home.InvalidClassId';
    return;
  }
  emit('join', classId.value);
}
</script>

<style lang="scss" scoped>
.preclass-mobile-root,
.preclass-mobile-root :deep(.rk-root-slot) {
  width: 100%;
  height: 100%;
}

.preclass-mobile {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 24px;
  color: var(--rk-text-primary);
  background: var(--rk-bg-page);
}

.preclass-mobile-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
}

.preclass-mobile-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 360px;
  padding: 20px;
  background: var(--rk-bg-surface);
  border-radius: var(--rk-radius-md);
}

.preclass-mobile-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.preclass-mobile-error {
  margin: 0;
  font-size: 12px;
  color: var(--rk-danger);
}

.preclass-mobile-logout {
  margin-top: 8px;
}
</style>
