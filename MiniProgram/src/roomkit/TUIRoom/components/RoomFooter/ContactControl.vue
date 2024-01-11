<template>
  <div class="more-control-container">
    <icon-button
      :icon="MoreIcon"
      :is-active="sidebarName === 'more'"
      :title="t('Contact us')"
      @click-icon="toggleContactSidebar"
    />
    <div v-if="isShowContactTab" class="contact-container">
      <room-contact ref="contactRef" @on-close-contact="handleOnCloseContact"></room-contact>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import MoreIcon from '../../assets/icons/MoreIcon.svg';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import { isMobile }  from '../../utils/environment';
import roomContact from '../RoomMore/index.vue';

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
  left: 0;
  top: 0;
  bottom: 0;
  width: 100vw;
  height: auto;
  box-sizing: border-box;
  background-color: var(--log-out-mobile);
  z-index: 11;
}
</style>

