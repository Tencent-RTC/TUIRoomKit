<template>
  <TuiDialog
    v-model="showRoomInvite"
    :title="t('Schedule successful, invite members to join')"
    :modal="true"
    :show-close="true"
    :close-on-click-modal="true"
    width="540px"
    :append-to-body="true"
    :title-icon="SuccessIcon"
  >
    <div class="invite-member">
      <div v-for="item in scheduleInviteList" :key="item.id" class="invite-member-container">
        <div class="invite-member-title">{{ t(item.title) }}</div>
        <div class="invite-member-item">
          <span class="invite-member-content"> {{ item.content }}</span>
          <svg-icon class="copy" :icon="copyIcon" @click="onCopy(item.content)"></svg-icon>
        </div>
      </div>
    </div>
    <template #footer>
      <span>
        <tui-button class="dialog-button" size="default" @click="copyRoomIdAndRoomLink()">{{ t('Copy the conference number and link') }}</tui-button>
      </span>
    </template>
  </TuiDialog>
</template>

<script setup lang="ts">
import { ref, defineProps, watch, computed } from 'vue';
import { useI18n } from '../../locales';
import TuiDialog from '../common/base/Dialog/index.vue';
import TuiButton from '../common/base/Button.vue';
import SuccessIcon from '../common/icons/SuccessIcon.vue';
import { TUIConferenceInfo } from '@tencentcloud/tuiroom-engine-electron';
import copyIcon from '../common/icons/CopyIcon.vue';
import SvgIcon from '../common/base/SvgIcon.vue';
import useRoomInfo from '../RoomHeader/RoomInfo/useRoomInfoHooks';
import { getUrlWithRoomId } from '../../utils/utils';

const { t } = useI18n();
const { onCopy } = useRoomInfo();

interface Props {
  conferenceInfo?: TUIConferenceInfo,
  scheduleParams?: any;
  visible: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(['input', 'close']);
const showRoomInvite = ref(false);

watch(
  () => props.visible,
  (val) => {
    showRoomInvite.value = val;
  },
  {
    immediate: true,
  },
);

const updateVisible = (val: boolean) => {
  emit('input', val);
};

const roomType = computed(() => (props.scheduleParams.isSeatEnabled ? `${t('On-stage Speaking Room')}` : `${t('Free Speech Room')}`));

function copyRoomIdAndRoomLink() {
  const invitation = `${props.scheduleParams.roomName}\n
${t('Room Type')}: ${roomType.value}\n
${t('Room Time')}: ${new Date(props.scheduleParams.scheduleStartTime * 1000)} - ${new Date(props.scheduleParams.scheduleEndTime * 1000)}\n
${t('Room ID')}: ${props.scheduleParams.roomId}\n
${t('Room Link')}: ${getUrlWithRoomId(props.scheduleParams.roomId)}`;
  onCopy(invitation);
}

const scheduleInviteList = computed(() => [
  { id: 1, title: `${t('Invitation by room ID')}`, content: props.scheduleParams.roomId },
  { id: 2, title: `${t('Invitation via room link')}`, content: getUrlWithRoomId(props.scheduleParams.roomId) },
]);

watch(showRoomInvite, (val) => {
  updateVisible(val);
}, { immediate: true });
</script>

<style lang="scss" scoped>
.invite-member {
  display: flex;
  flex-direction: column;
  gap: 20px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  .invite-member-title {
    color: #4F586B;
  }
  .invite-member-item {
    margin-top: 8px;
    border-radius: 8px;
    border: 1px solid #E4E8EE;
    background: #F9FAFC;
    padding: 10px 16px;
    color: #0F1014;
    display: flex;
    justify-content: space-between;
    .invite-member-content {
      max-width: 400px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .copy {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
  }
}
</style>
