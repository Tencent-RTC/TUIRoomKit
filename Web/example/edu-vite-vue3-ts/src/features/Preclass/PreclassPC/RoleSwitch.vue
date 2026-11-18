<template>
  <TUISegmented
    class="preclass-role"
    size="sm"
    :model-value="classRole"
    :options="roleOptions"
    :aria-label="t('Preclass.Identity')"
    @update:model-value="switchRole"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUISegmented, t } from '@tencentcloud/roomkit-web-vue3';
import { classRole, switchClassRole } from '../classRole';
import type { ClassRole } from '../types';

const roleOptions = computed(() => [
  { value: 'teacher', label: t('Preclass.RoleTeacher') },
  { value: 'student', label: t('Preclass.RoleStudent') },
]);

function switchRole(role: string) {
  switchClassRole(role as ClassRole);
}
</script>

<style scoped lang="scss">
.preclass-role {
  margin-right: 12px;
}
</style>
