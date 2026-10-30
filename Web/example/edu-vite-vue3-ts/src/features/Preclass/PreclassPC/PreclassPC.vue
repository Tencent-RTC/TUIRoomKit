<template>
  <RoomKitProvider class="preclass-root" scene="education">
    <div class="preclass-view">
      <PreconferenceTopbar
        class="preclass-topbar"
        :user-name="userName"
        :avatar-url="avatarUrl"
        @logout="emit('logout')"
      />
      <div v-if="faultBannerKey" class="preclass-fault-banner">
        <IconAlertCircle :size="14" />
        <span>{{ t(faultBannerKey) }}</span>
      </div>

      <main class="preclass-main">
        <div class="preclass-lobby">
          <section class="preclass-preview-card" :aria-label="t('Preconference.PreviewRegion')">
            <div class="preclass-hello">
              <h1>{{ t('Preclass.ReadyTitle') }}</h1>
              <p>{{ t('Preclass.ReadyDesc') }}</p>
            </div>
            <LocalPreview @banner-change="faultBannerKey = $event" />
          </section>

          <section class="preclass-panel">
            <nav class="preclass-tabs" :class="{ 'is-student': !isTeacher }" role="tablist">
              <button
                class="preclass-tab"
                :class="{ 'is-active': activeTab === 'list' }"
                type="button"
                role="tab"
                :aria-selected="activeTab === 'list'"
                @click="closeBook"
              >
                {{ t('Preclass.CourseList') }}
              </button>
              <button
                v-if="isTeacher"
                class="preclass-tab"
                :class="{ 'is-active': activeTab === 'book' }"
                type="button"
                role="tab"
                :aria-selected="activeTab === 'book'"
                @click="openBook()"
              >
                {{ editingCourse ? t('Preclass.EditClass') : t('Preclass.Book') }}
              </button>
            </nav>

            <div v-show="activeTab === 'list'" class="preclass-pane" role="tabpanel">
              <CourseBoard
                ref="boardRef"
                :courses="courses"
                :can-manage="isTeacher"
                :now="now"
                :link-of="classLink"
                :attendee-count-of="roomId => attendeesOf(roomId)?.length"
                @join="emit('join', $event)"
                @more="onMore"
                @visible-change="roomIds => roomIds.forEach(roomId => loadAttendees(roomId))"
              />
            </div>

            <div v-if="isTeacher && activeTab === 'book'" class="preclass-pane" role="tabpanel">
              <BookForm
                :key="formKey"
                :course="editingCourse"
                :attendee="editingCourse ? attendeesOf(editingCourse.roomId)?.[0] : undefined"
                :default-title="t('Classroom.DefaultName', { name: userName })"
                :submitting="submitting"
                @submit="submitBook"
                @cancel="closeBook"
              />
            </div>
          </section>
        </div>
      </main>

      <CourseDetailDialog
        v-model:open="detailOpen"
        :course="detailCourse"
        :link="detailCourse ? classLink(detailCourse.roomId) : ''"
        :attendees="detailCourse ? attendeesOf(detailCourse.roomId) ?? [] : []"
      />
      <CourseCancelDialog v-model:open="cancelOpen" :busy="cancelling" @confirm="confirmCancel" />
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import {
  IconAlertCircle,
  RoomKitProvider,
  TUIToast,
  t,
} from '@tencentcloud/roomkit-web-vue3';
import type { PickedContact } from '@tencentcloud/roomkit-web-vue3';
import type { ClassRole } from '../types';
import LocalPreview from './LocalPreview.vue';
import PreconferenceTopbar from './PreconferenceTopbar.vue';
import BookForm from './schedule/BookForm.vue';
import CourseBoard from './schedule/CourseBoard.vue';
import CourseCancelDialog from './schedule/CourseCancelDialog.vue';
import CourseDetailDialog from './schedule/CourseDetailDialog.vue';
import { classLink, useClassSchedule } from './schedule/useClassSchedule';
import type { BookInput, ClassCourse, CourseMoreCommand } from './schedule/useClassSchedule';

type PanelTab = 'list' | 'book';

const props = defineProps<{
  role: ClassRole;
}>();

const emit = defineEmits<{
  /** Mobile only; kept so the shared HomeView listener does not fall through to the root. */
  create: [];
  join: [roomId: string];
  logout: []
}>();

const { loginUserInfo } = useLoginState();
const userName = computed(() => loginUserInfo.value?.userName || loginUserInfo.value?.userId || '');
const avatarUrl = computed(() => loginUserInfo.value?.avatarUrl || '');
const isTeacher = computed(() => props.role === 'teacher');

const faultBannerKey = ref<string>();
const activeTab = ref<PanelTab>('list');

const { now, courses, fetchAttendees, book, update, cancel } = useClassSchedule();

const boardRef = ref<InstanceType<typeof CourseBoard>>();

// Rosters are fetched per class on demand and dropped whenever that class is rewritten.
const attendeeCache = ref<Record<string, PickedContact[]>>({});

function attendeesOf(roomId: string): PickedContact[] | undefined {
  return attendeeCache.value[roomId];
}

async function loadAttendees(roomId: string, force = false) {
  if (!roomId || (!force && attendeeCache.value[roomId])) return;
  try {
    const list = await fetchAttendees(roomId);
    attendeeCache.value = { ...attendeeCache.value, [roomId]: list };
  } catch (error) {
    console.error('[PreclassPC] Failed to load class members:', error);
  }
}

const editingCourse = ref<ClassCourse>();
const formKey = ref(0);
const submitting = ref(false);

function openBook(course?: ClassCourse) {
  editingCourse.value = course;
  formKey.value += 1;
  activeTab.value = 'book';
}

function closeBook() {
  editingCourse.value = undefined;
  activeTab.value = 'list';
}

async function submitBook(input: BookInput) {
  const editing = editingCourse.value;
  submitting.value = true;
  try {
    const outcome = editing ? await update(editing.roomId, input) : await book(input);
    if ('failure' in outcome) {
      TUIToast.error(t(editing ? 'Preclass.UpdateFailed' : 'Preclass.BookFailed'));
      return;
    }
    TUIToast.success(t(editing ? 'Preclass.Updated' : 'Preclass.BookedToast'));
    attendeeCache.value = { ...attendeeCache.value, [outcome.roomId]: [input.attendee] };
    closeBook();
    boardRef.value?.showDay(new Date(input.start * 1000));
  } finally {
    submitting.value = false;
  }
}

const detailOpen = ref(false);
const detailCourse = ref<ClassCourse>();
const cancelOpen = ref(false);
const cancelCourse = ref<ClassCourse>();
const cancelling = ref(false);

function onMore(course: ClassCourse, command: CourseMoreCommand) {
  if (command === 'detail') {
    detailCourse.value = course;
    detailOpen.value = true;
    loadAttendees(course.roomId);
  } else if (command === 'edit') {
    openBook(course);
    loadAttendees(course.roomId, true);
  } else {
    cancelCourse.value = course;
    cancelOpen.value = true;
  }
}

async function confirmCancel() {
  if (!cancelCourse.value || cancelling.value) return;
  cancelling.value = true;
  try {
    await cancel(cancelCourse.value.roomId);
    cancelOpen.value = false;
    cancelCourse.value = undefined;
    TUIToast.success(t('Preclass.Cancelled'));
  } catch (error) {
    console.error('[PreclassPC] Failed to cancel class:', error);
    TUIToast.error(t('Preclass.CancelFailed'));
  } finally {
    cancelling.value = false;
  }
}
</script>

<style scoped lang="scss">
.preclass-root,
.preclass-root :deep(.rk-root-slot) {
  height: 100%;
  min-height: 0;
}

.preclass-view {
  /* Lobby surface tints shared by the panel, schedule and form children. */
  --pre-line: color-mix(in srgb, var(--rk-text-primary) 7%, transparent);
  --pre-fill: color-mix(in srgb, var(--rk-text-primary) 5%, transparent);
  --pre-fill-hover: color-mix(in srgb, var(--rk-text-primary) 9%, transparent);

  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  color: var(--rk-text-primary);
  background:
    radial-gradient(900px 520px at 12% -8%, color-mix(in srgb, var(--rk-brand) 11%, transparent), transparent 62%),
    radial-gradient(760px 480px at 104% 108%, color-mix(in srgb, #ba68c8 9%, transparent), transparent 60%),
    var(--rk-bg-page);
}

.preclass-fault-banner {
  position: absolute;
  top: 64px;
  right: 24px;
  left: 24px;
  z-index: 20;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--rk-danger) 30%, transparent);
  border-radius: 12px;
}

.preclass-main {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 8px 40px 32px;
}

.preclass-lobby {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(480px, 560px);
  gap: 40px;
  align-items: center;
  width: 100%;
  max-width: 1240px;
  height: min(700px, 100%);
}

.preclass-preview-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: center;
  height: 100%;
  min-height: 0;
  container-type: size;
}

.preclass-hello h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 650;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.preclass-hello p {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--rk-text-secondary);
}

.preclass-preview-card :deep(.local-preview) {
  flex: none;
}

/* 150px is the title, the device row and their gaps; the 4:3 stage shrinks on short viewports. */
.preclass-preview-card :deep(.video-preview) {
  align-self: center;
  width: min(100%, calc((100cqh - 150px) * 4 / 3));
}

.preclass-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: color-mix(in srgb, var(--rk-bg-surface) 82%, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid var(--pre-line);
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.preclass-tabs {
  display: flex;
  flex: none;
  gap: 2px;
  align-self: center;
  padding: 3px;
  margin: 16px 16px 4px;
  background: var(--pre-fill);
  border-radius: 10px;
}

.preclass-tab {
  height: 30px;
  padding: 0 14px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
}

.preclass-tab:hover:not(.is-active) {
  color: var(--rk-text-primary);
}

.preclass-tab.is-active {
  font-weight: 600;
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-text-primary) 12%, transparent);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
}

/* A student has a single tab, so it reads as the panel title instead of a switch. */
.preclass-tabs.is-student {
  align-self: flex-start;
  padding: 0;
  background: transparent;
}

.preclass-tabs.is-student .preclass-tab.is-active {
  padding: 0 4px;
  font-size: 16px;
  font-weight: 650;
  background: transparent;
  box-shadow: none;
}

.preclass-pane {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}
</style>
