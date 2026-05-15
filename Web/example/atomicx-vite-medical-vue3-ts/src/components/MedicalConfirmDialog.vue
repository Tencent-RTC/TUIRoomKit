<script setup lang="ts">
import MedicalButton from '@/components/MedicalButton.vue';

withDefaults(
  defineProps<{
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    danger?: boolean;
  }>(),
  {
    confirmText: '确认',
    cancelText: '取消',
    loading: false,
    danger: false,
  }
);

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4"
      @click.self="emit('cancel')"
    >
      <div
        class="w-full max-w-[380px] rounded-3xl bg-card p-6 text-card-foreground shadow-[0_20px_60px_rgba(15,23,42,0.25)]"
      >
        <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
        <p class="mt-3 text-sm leading-6 text-muted-foreground">
          {{ message }}
        </p>
        <div class="mt-6 grid grid-cols-2 gap-3">
          <MedicalButton
            variant="outline"
            :disabled="loading"
            @click="emit('cancel')"
          >
            {{ cancelText }}
          </MedicalButton>
          <MedicalButton
            :variant="danger ? 'danger' : 'primary'"
            :loading="loading"
            @click="emit('confirm')"
          >
            {{ loading ? '处理中...' : confirmText }}
          </MedicalButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
