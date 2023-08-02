<template>
  <div class="more-control-container">
    <icon-button
      :is-active="sidebarName === 'more'"
      :title="t('Contact us')"
      icon-name="contact-us-h5"
      @click-icon="toggleContactSidebar"
    />
    <div v-if="isShowContactTab" class="contact-container">
      <room-contact ref="contactRef"></room-contact>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import IconButton from '../common/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import isMobile from '../../utils/useMediaValue';
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


function handleDocumentClick(event: MouseEvent) {
  if (isShowContactTab.value && contactRef.value && !contactRef.value.$el.contains(event.target)) {
    isShowContactTab.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick, true);
});
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

