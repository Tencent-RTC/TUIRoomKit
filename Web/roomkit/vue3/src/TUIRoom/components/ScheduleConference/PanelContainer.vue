<template>
  <div>
    <div class="panel-container h5" v-if="panelVisible && isMobile">
      <div class="container-header">
        <IconArrowStrokeBack
          class="container-header-back"
          size="20"
          @click="closePanel"
        />
        <span class="container-header-title">
          {{ props.title }}
        </span>
        <template v-if="!$slots.edit">
          <slot name="edit"></slot>
          <span class="container-header-edit" @click="handleEdit">
            {{ props.editButtonText || '' }}
          </span>
        </template>
      </div>
      <div class="container-content">
        <slot></slot>
      </div>
      <slot name="footer"></slot>
    </div>
    <TuiDialog
      v-if="!isMobile"
      v-model="panelVisible"
      :title="title"
      :modal="true"
      :append-to-body="true"
      :width="width"
    >
      <slot></slot>
      <template v-if="$slots.footer" #footer>
        <slot name="footer"></slot>
      </template>
    </TuiDialog>
  </div>
</template>
<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';
import { IconArrowStrokeBack } from '@tencentcloud/uikit-base-component-vue3';
import { isMobile } from '../../utils/environment';
import TuiDialog from '../common/base/Dialog';
const emit = defineEmits(['input', 'edit']);
const props = defineProps<{
  visible: boolean;
  title?: string;
  editButtonText?: boolean | string;
  width?: string;
}>();

const panelVisible = ref(false);
const closePanel = () => {
  emit('input', false);
};
watch(
  () => props.visible,
  val => {
    panelVisible.value = val;
  },
  {
    immediate: true,
  }
);

watch(
  panelVisible,
  val => {
    emit('input', val);
  },
  { immediate: true }
);

const handleEdit = () => emit('edit');
</script>
<style scoped lang="scss">
.panel-container.h5 {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: var(--bg-color-topbar);

  .container-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5%;
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    color: var(--text-color-primary);
    background-color: var(--bg-color-topbar);

    .container-header-back {
      flex: 1;
      justify-content: flex-start;
      text-align: left;
    }

    .container-header-title {
      flex: 2;
      text-align: center;
    }

    .container-header-edit {
      flex: 1;
      text-align: right;
      color: var(--text-color-link);
    }
  }

  .container-content {
    flex: 1;
    height: 100%;
    margin: 16px;
    overflow-y: auto;
  }
}
</style>
