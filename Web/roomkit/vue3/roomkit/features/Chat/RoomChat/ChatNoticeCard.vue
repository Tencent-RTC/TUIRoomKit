<template>
  <div class="chat-notice-card">
    <button
      v-if="canModerate"
      type="button"
      class="chat-notice-edit"
      :aria-label="t('Education.Notice.EditTooltip')"
      :title="t('Education.Notice.EditTooltip')"
      @click="openEditor"
    >
      <IconEduNoticeEdit :size="14" />
    </button>
    <div class="chat-notice-top">
      <span class="chat-notice-badge">{{ t('Education.Notice.Badge') }}</span>
      <strong class="chat-notice-title">{{ notice.title }}</strong>
    </div>
    <div v-if="notice.lines.length" class="chat-notice-list-scroll">
      <p class="chat-notice-list">{{ notice.lines.join('\n') }}</p>
    </div>
    <TUIDialog
      v-model:open="editorOpen"
      :title="t('Education.Notice.EditTitle')"
      width="340px"
      :close-on-overlay="false"
      :confirm-text="t('Education.Notice.Save')"
      :cancel-text="t('Room.Cancel')"
      @confirm="onConfirm"
    >
      <p class="chat-notice-edit-hint">{{ t('Education.Notice.EditHint') }}</p>
      <label class="chat-notice-edit-field">
        <span>{{ t('Education.Notice.TitleLabel') }}</span>
        <TUIInput
          v-model="draftTitle"
          :maxlength="NOTICE_TITLE_MAX"
          :placeholder="t('Education.Notice.TitlePlaceholder')"
        />
      </label>
      <label class="chat-notice-edit-field chat-notice-edit-content">
        <span>{{ t('Education.Notice.ContentLabel') }}</span>
        <TUIInput
          v-model="draftContent"
          type="textarea"
          :rows="3"
          :maxlength="NOTICE_CONTENT_MAX"
        />
      </label>
    </TUIDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useChatContext } from 'tuikit-atomicx-vue3/chat';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { IconEduNoticeEdit, TUIDialog, TUIInput, t } from '../../../base';
import { useParticipantPermission } from '../../Participants/participantData';
import { EDU_CLASS_EVENT_ID, latestProtocolEvent, sendNotice } from '../customMessage';
import { selfDisplayName } from './memberNotice';

/** Classroom notice content shown on the card. */
interface ClassroomNotice {
  readonly title: string;
  readonly lines: string[];
}

const props = defineProps<{
  /**
   * Chat channel (room id). The notice derives from this channel's history,
   * so the card must live under RoomChat's `:key="channel"` subtree.
   */
  channel: string;
}>();

/** Card title length. The notice sits in a narrow chat column. */
const NOTICE_TITLE_MAX = 20;

/** Content length. The field itself stays a fixed height and scrolls inside it. */
const NOTICE_CONTENT_MAX = 200;

const { currentRoom } = useRoomState();
const { messageList } = useChatContext(props.channel);
const { isHostOrAdmin: canModerate } = useParticipantPermission();

/** Welcome copy the class starts with, before the teacher publishes one. */
function defaultClassroomNotice(): ClassroomNotice {
  return {
    title: t('Education.Notice.WelcomeTitle'),
    lines: t('Education.Notice.WelcomeLines').split('\n').filter(Boolean),
  };
}

// Read side: the latest `notice-update` class event in the loaded history
// wins; a notice older than the history pages falls back to the welcome copy.
const noticeEnvelope = computed(() => (
  latestProtocolEvent(messageList.value ?? [], EDU_CLASS_EVENT_ID, ['notice-update'])
));
const notice = computed<ClassroomNotice>(() => {
  const envelope = noticeEnvelope.value;
  return envelope
    ? {
      title: noticeTitle(String(envelope.data.title ?? '')),
      lines: Array.isArray(envelope.data.lines)
        ? envelope.data.lines.map(line => String(line))
        : [],
    }
    : defaultClassroomNotice();
});

// Write side: publishing rides the same timeline, so every member,
// including late joiners, converges on the last notice.
async function updateNotice(next: ClassroomNotice): Promise<void> {
  const roomId = currentRoom.value?.roomId || '';
  try {
    await sendNotice(EDU_CLASS_EVENT_ID, roomId, 'notice-update', {
      title: next.title,
      lines: next.lines,
      actor: selfDisplayName(),
    });
  } catch (error) {
    console.error('[RoomKit.noticeCard] notice update send failed:', error);
  }
}

const editorOpen = ref(false);
const draftTitle = ref('');
const draftContent = ref('');

function openEditor(): void {
  // Seed from the card the teacher is looking at. Before anyone publishes,
  // that card is the welcome copy; leaving the fields blank made the dialog
  // look empty while the card beside it still listed the welcome items.
  const current = notice.value;
  draftTitle.value = current.title.replace(/[:：]$/, '').slice(0, NOTICE_TITLE_MAX);
  draftContent.value = current.lines.join('\n').slice(0, NOTICE_CONTENT_MAX);
  editorOpen.value = true;
}

/** Drop a trailing colon left by older saves that appended one. */
function noticeTitle(title: string): string {
  return title.replace(/[:：]$/, '');
}

/** Empty input falls back to the default title. The card shows the title as written. */
function composeNoticeTitle(title: string): string {
  return title.trim().slice(0, NOTICE_TITLE_MAX) || t('Education.Notice.DefaultTitle');
}

function onConfirm(): void {
  void updateNotice({
    title: composeNoticeTitle(draftTitle.value),
    lines: draftContent.value
      .slice(0, NOTICE_CONTENT_MAX)
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean),
  });
  editorOpen.value = false;
}
</script>

<style scoped lang="scss" src="./ChatNoticeCard.scss"></style>
