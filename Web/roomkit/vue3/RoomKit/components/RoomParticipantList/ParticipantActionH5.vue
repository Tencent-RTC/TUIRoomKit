<template>
  <TUIPopup
    :visible="visible"
    @update:visible="handleUpdateVisible"
  >
    <PopUpArrowDown @click="handleUpdateVisible(false)" />
    <div class="participant-action-h5">
      <div class="participant-action-h5-header">
        <Avatar :src="participant?.avatarUrl" />
        <span class="participant-action-h5-header-title">{{ title }}</span>
      </div>
      <div
        v-for="item in controlList"
        :key="item.key"
        class="action-item"
        :style="item?.style || {}"
        @click="handleActionClick(item.handler)"
      >
        <TUIIcon
          v-if="item?.icon"
          :icon="item?.icon"
          size="20"
          class="action-icon"
        />
        <span class="action-text">{{ item.label }}</span>
      </div>
    </div>
  </TUIPopup>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, toRef } from 'vue';
import { useUIKit, TUIIcon, TUIPopup } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from 'tuikit-atomicx-vue3';
import PopUpArrowDown from './PopUpArrowDown.vue';
import { useParticipantAction } from './useParticpantAction';
import type { RoomParticipant } from 'tuikit-atomicx-vue3';

defineOptions({
  name: 'ParticipantActionH5',
});

interface Props {
  visible: boolean;
  participant: RoomParticipant | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
}>();

const { t } = useUIKit();

const title = computed(() => {
  if (!props.participant) {
    return t('ParticipantList.Operation');
  }
  const displayName = props.participant?.nameCard || props.participant?.userName || props.participant?.userId;
  return displayName;
});

const controlList = computed(() => {
  if (!props.participant) {
    return [];
  }
  const { controlList: list } = useParticipantAction({ targetParticipant: toRef(props, 'participant') as Ref<RoomParticipant> });

  return list.value;
});

const handleUpdateVisible = (value: boolean) => {
  emit('update:visible', value);
};

const handleActionClick = (handler: () => void) => {
  handler();
  emit('update:visible', false);
};
</script>

<style scoped lang="scss">
.participant-action-h5 {
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  -webkit-tap-highlight-color: transparent;

  .participant-action-h5-header {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;

    .participant-action-h5-header-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
  }
}

.action-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s ease;
  gap: 12px;
  color: var(--text-color-secondary);
  font-size: 16px;
  font-weight: 400;
  border-bottom: 1px solid var(--stroke-color-secondary);
  padding: 16px 0;

  &:active {
    background: var(--list-color-hover);
  }

  .action-icon {
    flex-shrink: 0;
  }

  .action-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
