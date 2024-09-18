<template>
  <div>
    <div class="panel-container h5" v-if="panelVisible && isMobile">
      <div class="container-header">
        <svg-icon
          class="container-header-back"
          :icon="ArrowStrokeBackIcon"
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
import { isMobile } from '../../utils/environment';
import SvgIcon from '../common/base/SvgIcon.vue';
import TuiDialog from '../common/base/Dialog';
import ArrowStrokeBackIcon from '../common/icons/ArrowStrokeBackIcon.vue';
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
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #f8f9fb;

  .container-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5%;
    font-size: 16px;
    font-weight: 500;
    color: #2b2e38;
    text-align: center;
    background-color: #fff;

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
      color: #1c66e5;
      text-align: right;
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
