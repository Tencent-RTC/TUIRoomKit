<template>
  <div class="more-control-container">
    <icon-button
      :icon="MoreIcon"
      :is-active="sidebarName === 'more'"
      :title="t('Contact us')"
      @click-icon="toggleContactSidebar"
    />
    <div v-if="isShowContactTab" class="contact-container">
      <room-contact ref="contactRef" @on-close-contact="handleOnCloseContact" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import MoreIcon from '../common/icons/MoreIcon.vue';
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
  background-color: var(--log-out-mobile);
}
</style>
