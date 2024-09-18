<template>
  <div>
    <tui-badge
      :hidden="applyToAnchorList.length === 0"
      :value="applyToAnchorList.length"
      :max="10"
      type="danger"
    >
      <icon-button
        :title="t('Apply to stage')"
        :icon="StageApplicationIcon"
        :is-active="sidebarName === 'apply'"
        @click-icon="toggleManageStage"
      />
    </tui-badge>
    <master-apply-control v-show="showApplyUserList" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import IconButton from '../common/base/IconButton.vue';
import StageApplicationIcon from '../common/icons/StageApplicationIcon.vue';
import { useBasicStore } from '../../stores/basic';
import { useRoomStore } from '../../stores/room';
import { useI18n } from '../../locales';
import TuiBadge from '../common/base/Badge.vue';
import { isMobile } from '../../utils/environment';
import MasterApplyControl from './ApplyControl/MasterApplyControl';
import useMasterApplyControl from '../../hooks/useMasterApplyControl';

const { t } = useI18n();

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { handleShowNotification } = useMasterApplyControl();
const { sidebarName, showApplyUserList } = storeToRefs(basicStore);
const { applyToAnchorList } = storeToRefs(roomStore);

function toggleManageStage() {
  if (!isMobile) {
    basicStore.setShowApplyUserList(!showApplyUserList.value);
  } else {
    if (basicStore.isSidebarOpen && basicStore.sidebarName === 'apply') {
      basicStore.setSidebarOpenStatus(false);
      basicStore.setSidebarName('');
      return;
    }
    basicStore.setSidebarOpenStatus(true);
    basicStore.setSidebarName('apply');
  }
}

handleShowNotification();
</script>
