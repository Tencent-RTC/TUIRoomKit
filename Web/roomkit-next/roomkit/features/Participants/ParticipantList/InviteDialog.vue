<template>
  <UserPicker
    :open="open"
    :occupied-ids="occupiedUserIds"
    @update:open="$emit('update:open', $event)"
    @confirm="confirm"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUIToast } from '../../../base';
import { t } from '../../../i18n';
import UserPicker from '../UserPicker/UserPicker.vue';
import type { PickedContact } from '../UserPicker/contactPicker';
import { useInvitation } from './useInvitation';
import { formatNameList, useParticipantList } from './useParticipant';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const { joinedParticipants, pendingParticipants } = useParticipantList();
const { inviteUsers } = useInvitation();

const occupiedIds = computed(() => {
  const ids = new Set<string>();
  for (const participant of joinedParticipants.value) {
    ids.add(participant.userId);
  }
  for (const participant of pendingParticipants.value) {
    ids.add(participant.userId);
  }
  return ids;
});

const occupiedUserIds = computed(() => [...occupiedIds.value]);

async function confirm(users: PickedContact[]) {
  const userIdList = users.map(user => user.userId);
  const failure = await inviteUsers(userIdList);
  if (failure) {
    TUIToast[failure === 'failed' ? 'error' : 'warning'](t(`Participants.InviteFailure.${failure}`));
    return;
  }
  const names = users.map(user => user.userName || user.userId);
  TUIToast.success(userIdList.length
    ? t('Participants.CallStarted', { name: formatNameList(names) })
    : t('Participants.InviteSent'));
  emit('update:open', false);
}
</script>
