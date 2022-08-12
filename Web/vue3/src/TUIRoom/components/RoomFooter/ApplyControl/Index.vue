<template>
  <master-apply-control v-if="showMasterControl"></master-apply-control>
  <member-apply-control v-if="showMemberControl"></member-apply-control>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MasterApplyControl from './MasterApplyControl.vue';
import MemberApplyControl from './MemberApplyControl.vue';
import { useBasicStore } from '../../../stores/basic';
import { ETUIRoomRole } from '../../../tui-room-core';

const basicStore = useBasicStore();

const showMasterControl = computed(() => Boolean(basicStore.role) && basicStore.role === ETUIRoomRole.MASTER);

const showMemberControl = computed(() => Boolean(basicStore.role) && basicStore.role !== ETUIRoomRole.MASTER);

</script>
