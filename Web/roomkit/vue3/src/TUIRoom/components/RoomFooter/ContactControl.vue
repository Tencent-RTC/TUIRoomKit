<template>
  <div class="more-control-container">
    <icon-button
      :is-active="sidebarName === 'more'"
      :title="t('Contact us')"
      @click-icon="toggleContactSidebar"
    >
      <IconMore size="24" />
    </icon-button>
    <div v-if="isShowContactTab" class="contact-container">
      <room-contact ref="contactRef" @on-close-contact="handleOnCloseContact" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconMore } from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../common/base/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import { isMobile } from '../../utils/environment';
import roomContact from '../RoomMore';

const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);
const { t } = useI18n();
const isShowContactTab = ref(false);
const contactRef = ref();

function toggleContactSidebar() {
  if (!isMobile) {
    if (basicStore.setSidebarOpenStatus && basicStore.sidebarName === 'more') {
      basicStore.setSidebarOpenStatus(false);
      basicStore.setSidebarName('');
      return;
    }
    basicStore.setSidebarOpenStatus(true);
    basicStore.setSidebarName('more');
  } else {
    isShowContactTab.value = true;
    if (basicStore.sidebarName === 'more') {
      basicStore.setSidebarName('');
      return;
    }
    basicStore.setSidebarName('more');
  }
}

function handleOnCloseContact() {
  isShowContactTab.value = false;
}
</script>

<style lang="scss" scoped>
.contact-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 11;
  box-sizing: border-box;
  width: 100vw;
  height: auto;
  background-color: var(--uikit-color-black-8);
}
</style>
