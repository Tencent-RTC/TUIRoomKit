<template>
  <div
    v-if="applyToOnSeatUserList.length > 0 && !isGeneralUser"
    class="apply-on-stage-info"
  >
    <IconApplyTips size="24" class="apply-icon" />
    <div class="apply-info">{{ applyToAnchorUserContent }}</div>
    <div class="apply-check" @click="showApplyUserList">{{ t('Check') }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUIRole } from '@tencentcloud/tuiroom-engine-js';
import { IconApplyTips } from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../../../locales';
import { useBasicStore } from '../../../../stores/basic';
import { isMobile } from '../../../../utils/environment';
import { useUserState } from '../../../../core';

const { t } = useI18n();
const basicStore = useBasicStore();
const { applyToOnSeatUserList, localUser } = useUserState();
const isGeneralUser = computed(
  () => localUser.value?.userRole === TUIRole.kGeneralUser
);

const applyToAnchorUserContent = computed(() => {
  const lastIndex = applyToOnSeatUserList.value.length - 1;
  const userName =
    applyToOnSeatUserList.value[lastIndex]?.nameCard ||
    applyToOnSeatUserList.value[lastIndex]?.userName ||
    applyToOnSeatUserList.value[lastIndex]?.userId;
  if (applyToOnSeatUserList.value.length === 1) {
    return `${userName} ${t('Applying for the stage')}`;
  }
  return `${userName} ${t('and so on number people applying to stage', { number: applyToOnSeatUserList.length })}`;
});

function showApplyUserList() {
  if (isMobile) {
    basicStore.setSidebarOpenStatus(true);
    basicStore.setSidebarName('apply');
  } else {
    basicStore.setShowApplyUserList(true);
  }
}
</script>

<style lang="scss" scoped>
.apply-on-stage-info {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 60px;
  padding: 0 20px 0 32px;
  background-color: var(--bg-color-operate);

  .apply-icon {
    color: var(--text-color-secondary);
  }

  .apply-info {
    flex: 1;
    padding-left: 4px;
    font-size: 14px;
    font-weight: 400;
    color: var(--text-color-secondary);
  }

  .apply-check {
    font-size: 14px;
    font-weight: 400;
    line-height: 32px;
    color: var(--text-color-link);
    text-align: center;
    cursor: pointer;
  }
}
</style>
