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
import { useRoute, useRouter } from 'vue-router';
import { TUISegmented, t } from '@tencentcloud/roomkit-web-vue3';
import { classRole, switchClassRole } from '../classRole';
import type { ClassRole } from '../types';

const route = useRoute();
const router = useRouter();

const roleOptions = computed(() => [
  { value: 'teacher', label: t('Preclass.RoleTeacher') },
  { value: 'student', label: t('Preclass.RoleStudent') },
]);

/** Dropping `roomId` also drops the resume banner and any prefilled class id. */
function switchRole(role: string) {
  switchClassRole(role as ClassRole);
  router.replace({ query: { ...route.query, roomId: undefined } });
}
</script>

<style scoped lang="scss">
.preclass-role {
  margin-right: 12px;
}
</style>
