<template>
  <TuiDialog
    v-model="showRoomInvite"
    :title="t('Schedule successful, invite members to join')"
    :modal="true"
    :show-close="true"
    :close-on-click-modal="true"
    width="540px"
    :append-to-body="true"
    :title-icon="IconSuccess"
  >
    <div class="invite-member">
      <div
        v-for="item in scheduleInviteList"
        :key="item.id"
        class="invite-member-container"
      >
        <div class="invite-member-title">{{ t(item.title) }}</div>
        <div class="invite-member-item">
          <span class="invite-member-content"> {{ item.content }}</span>
          <IconCopy class="copy" @click="onCopy(item.content)" />
        </div>
      </div>
    </div>
    <template #footer>
      <span>
        <TUIButton @click="copyRoomIdAndRoomLink()" type="primary">
          {{ t('Copy the conference number and link') }}
        </TUIButton>
      </span>
    </template>
  </TuiDialog>
</template>

<script setup lang="ts">
import { ref, defineProps, watch, computed, defineEmits } from 'vue';
import { storeToRefs } from 'pinia';
import {
  TUIButton,
  IconCopy,
  IconSuccess,
} from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../locales';
import TuiDialog from '../common/base/Dialog';
import { TUIConferenceInfo } from '@tencentcloud/tuiroom-engine-js';
import useRoomInfo from '../RoomHeader/RoomInfo/useRoomInfoHooks';
import { getUrlWithRoomId } from '../../utils/utils';
import { useBasicStore } from '../../stores/basic';
import { roomService } from '../../services';

const basicStore = useBasicStore();
const { isRoomLinkVisible } = storeToRefs(basicStore);
const roomLinkConfig = roomService.getComponentConfig('RoomLink');
const { t } = useI18n();
const { onCopy } = useRoomInfo();

interface Props {
  conferenceInfo?: TUIConferenceInfo;
  scheduleParams?: any;
  visible: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(['input', 'close']);
const showRoomInvite = ref(false);

watch(
  () => props.visible,
  val => {
    showRoomInvite.value = val;
  },
  {
    immediate: true,
  }
);

const updateVisible = (val: boolean) => {
  emit('input', val);
};

const roomType = computed(() =>
  props.scheduleParams.isSeatEnabled
    ? `${t('On-stage Speaking Room')}`
    : `${t('Free Speech Room')}`
);

const isShowPassword = computed(() => !!props.scheduleParams.password);

function copyRoomIdAndRoomLink() {
  const invitationList = [
    `${props.scheduleParams.roomName}`,
    `${t('Room Type')}: ${roomType.value}`,
    `${t('Room ID')}: ${props.scheduleParams.roomId}`,
  ];
  if (isShowPassword.value) {
    invitationList.push(
      `${t('Room Password')}: ${props.scheduleParams.password}`
    );
  }
  if (isRoomLinkVisible.value && roomLinkConfig.visible) {
    invitationList.push(
      `${t('Room Link')}: ${getUrlWithRoomId(props.scheduleParams.roomId)}`
    );
  }

  const invitation = invitationList.join('\n');
  onCopy(invitation);
}

const scheduleInviteList = computed(() => [
  {
    id: 1,
    title: `${t('Invitation by room ID')}`,
    content: props.scheduleParams.roomId,
  },
  {
    id: 2,
    title: `${t('Invitation via room link')}`,
    content: getUrlWithRoomId(props.scheduleParams.roomId),
  },
]);

watch(
  showRoomInvite,
  val => {
    updateVisible(val);
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.invite-member {
  display: flex;
  flex-direction: column;
  gap: 20px;
  user-select: none;

  .invite-member-title {
    color: var(--text-color-primary);
  }

  .invite-member-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 16px;
    margin-top: 8px;
    border-radius: 8px;
    background-color: var(--bg-color-input);
    color: var(--text-color-primary);
    border: 1px solid var(--stroke-color-module);

    .invite-member-content {
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .copy {
      cursor: pointer;
      color: var(--text-color-link);
    }
  }
}
</style>
