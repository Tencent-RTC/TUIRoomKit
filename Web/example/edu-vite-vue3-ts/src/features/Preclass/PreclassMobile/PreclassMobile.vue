<template>
  <RoomKitProvider class="preclass-mobile-root" scene="education">
    <div class="preclass-mobile">
      <div class="preclass-mobile-main">
        <header class="preclass-mobile-bar">
          <div class="preclass-mobile-brand">
            <span class="preclass-mobile-mark" aria-hidden="true">
              <IconMonitor :size="15" />
            </span>
            <span class="preclass-mobile-brand-name">RoomKit <em>· EDU</em></span>
          </div>
          <span class="preclass-mobile-role">{{ t('Preclass.RoleStudent') }}</span>
          <button
            class="preclass-mobile-user"
            type="button"
            aria-haspopup="dialog"
            :aria-expanded="accountOpen"
            :aria-label="userName"
            @click="accountOpen = !accountOpen"
          >
            <TUIAvatar
              :size="32"
              :src="avatarUrl"
              :alt="userName || t('Preconference.AvatarFallback')"
            />
          </button>
        </header>
        <ResumeBanner
          v-if="shouldShowResume"
          :room-id="linkRoomId"
          :course="courses.find(course => course.roomId === linkRoomId)"
          @back="emit('join', linkRoomId)"
          @dismiss="dismissResume"
        />

        <div class="preclass-mobile-body">
          <section class="preclass-mobile-ready">
            <h1 class="preclass-mobile-ready-title">
              {{ t('Preclass.ReadyTitle') }}
            </h1>
            <PreclassPreviewMobile />
          </section>
          <section class="preclass-mobile-list">
            <TUISegmented v-model="activeTab" class="preclass-mobile-tabs" :options="tabOptions" />
            <JoinClassForm
              v-if="activeTab === 'join'"
              :initial-room-id="isInviteLink ? linkRoomId : ''"
              @join="emit('join', $event)"
            />
            <div v-else class="preclass-mobile-cards">
              <div v-if="!groups.length && !isLoaded" class="preclass-mobile-empty" role="status">
                <TUILoading size="lg" />
              </div>
              <div v-else-if="!groups.length" class="preclass-mobile-empty">
                <IconCourseEmpty class="preclass-mobile-empty-art" />
                <span>{{ t('Preclass.ListEmpty') }}</span>
              </div>
              <div v-for="group in groups" :key="group.key" class="preclass-mobile-group">
                <p class="preclass-mobile-day">
                  {{ group.label }}
                </p>
                <div
                  v-for="course in group.courses"
                  :key="course.roomId"
                  class="preclass-mobile-card"
                  :class="{ 'is-live': course.status === 'live' }"
                  role="button"
                  tabindex="0"
                  @click="openDetail(course)"
                  @keydown.enter.prevent="openDetail(course)"
                >
                  <span class="preclass-mobile-when">
                    <em class="preclass-mobile-mode">{{ t('Preclass.ClassModeOneOnOne') }}</em>
                    <b>{{ formatClock(course.start) }}</b>
                    <em>{{ formatClock(course.end) }}</em>
                  </span>
                  <span class="preclass-mobile-info">
                    <span class="preclass-mobile-title">
                      <strong>{{ course.title }}</strong>
                      <em class="preclass-mobile-status">
                        {{ t(course.status === 'live' ? 'Preclass.StatusLive' : 'Preclass.StatusIdle') }}
                      </em>
                    </span>
                    <span class="preclass-mobile-meta">
                      <span class="preclass-mobile-meta-text">
                        {{ t('Preclass.Minutes', { n: Math.round((course.end - course.start) / 60) }) }}
                        · {{ t('Preclass.RoomId') }} {{ course.roomId }}
                      </span>
                      <button
                        class="preclass-mobile-copy-id"
                        type="button"
                        :aria-label="t('Preclass.CopyRoomId')"
                        @click.stop="copy(`room:${course.roomId}`, course.roomId)"
                      >
                        <IconCheck v-if="copied === `room:${course.roomId}`" :size="12" />
                        <IconCopy v-else :size="12" />
                      </button>
                    </span>
                    <span class="preclass-mobile-meta">
                      <i class="preclass-mobile-face">{{ mark(course.teacherName) }}</i>
                      <span class="preclass-mobile-meta-text">{{ course.teacherName }}</span>
                    </span>
                    <span class="preclass-mobile-actions">
                      <button
                        class="preclass-mobile-action"
                        type="button"
                        @click.stop="copy(`invite:${course.roomId}`, inviteText(course, classLink(course.roomId)))"
                      >
                        {{ copied === `invite:${course.roomId}` ? t('Preclass.Copied') : t('Preclass.CopyInvite') }}
                      </button>
                      <button class="preclass-mobile-action is-primary" type="button" @click.stop="emit('join', course.roomId)">
                        {{ t('Preclass.EnterClass') }}
                      </button>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div v-if="selected" class="preclass-mobile-detail" :data-screen="screen">
        <section class="preclass-mobile-page">
          <header class="preclass-mobile-nav">
            <button class="preclass-mobile-back" type="button" :aria-label="t('Preclass.Back')" @click="screen = 'home'">
              <IconChevronRightMobile :size="22" />
            </button>
            <div class="preclass-mobile-nav-title">
              {{ t('Preclass.DetailTitle') }}
            </div>
          </header>
          <div class="preclass-mobile-sheet">
            <div class="preclass-mobile-block">
              <div class="preclass-mobile-line">
                <span>{{ t('Preclass.RoomName') }}</span>
                <b>{{ selected.title }}</b>
              </div>
              <div class="preclass-mobile-line">
                <span>{{ t('Preclass.Teacher') }}</span>
                <b>
                  <i class="preclass-mobile-face">{{ mark(selected.teacherName) }}</i>
                  {{ selected.teacherName }}
                </b>
              </div>
              <div class="preclass-mobile-line">
                <span>{{ t('Preclass.StartTime') }}</span>
                <b>{{ startLabel }}</b>
              </div>
              <div class="preclass-mobile-line">
                <span>{{ t('Preclass.Duration') }}</span>
                <b>{{ t('Preclass.Minutes', { n: durationMinutes }) }}</b>
              </div>
              <div class="preclass-mobile-line">
                <span>{{ t('Preclass.Timezone') }}</span>
                <b>{{ browserTimezoneLabel() }}</b>
              </div>
              <div class="preclass-mobile-line">
                <span>{{ t('Preclass.ClassMode') }}</span>
                <b>{{ t('Preclass.ClassModeOneOnOne') }}</b>
              </div>
              <button
                class="preclass-mobile-line"
                type="button"
                :disabled="!attendees?.length"
                @click="screen = 'members'"
              >
                <span>{{ t('Preclass.Members') }}</span>
                <b>
                  <span class="preclass-mobile-faces">
                    <i v-for="user in faceAttendees" :key="user.userId">{{ mark(user.userName) }}</i>
                  </span>
                  <span>{{ memberCount }}</span>
                  <IconChevronRightMobile v-if="attendees?.length" class="preclass-mobile-chev" :size="16" />
                </b>
              </button>
            </div>
            <div class="preclass-mobile-block">
              <div class="preclass-mobile-line">
                <span>{{ t('Preclass.RoomId') }}</span>
                <b>
                  <span>{{ selected.roomId }}</span>
                  <button
                    class="preclass-mobile-copy"
                    :class="{ 'is-copied': copied === 'room' }"
                    type="button"
                    :aria-label="t('Preclass.CopyRoomId')"
                    @click="copy('room', selected.roomId)"
                  >
                    <IconCheck v-if="copied === 'room'" :size="14" />
                    <IconCopy v-else :size="14" />
                  </button>
                </b>
              </div>
              <div class="preclass-mobile-line">
                <span>{{ t('Preclass.ShareLink') }}</span>
                <b>
                  <span>{{ shareLink }}</span>
                  <button
                    class="preclass-mobile-copy"
                    :class="{ 'is-copied': copied === 'link' }"
                    type="button"
                    :aria-label="t('Preclass.CopyLink')"
                    @click="copy('link', shareLink)"
                  >
                    <IconCheck v-if="copied === 'link'" :size="14" />
                    <IconCopy v-else :size="14" />
                  </button>
                </b>
              </div>
            </div>
          </div>
          <footer class="preclass-mobile-foot">
            <button class="preclass-mobile-go is-secondary" type="button" @click="copyInvite">
              {{ t('Preclass.CopyInvite') }}
            </button>
            <button class="preclass-mobile-go" type="button" @click="emit('join', selected.roomId)">
              {{ t('Preclass.EnterClass') }}
            </button>
          </footer>
        </section>

        <section class="preclass-mobile-page" data-page="members">
          <header class="preclass-mobile-nav">
            <button class="preclass-mobile-back" type="button" :aria-label="t('Preclass.Back')" @click="screen = 'detail'">
              <IconChevronRightMobile :size="22" />
            </button>
            <div class="preclass-mobile-nav-title">
              {{ t('Preclass.Members') }}
            </div>
          </header>
          <div class="preclass-mobile-sheet">
            <div class="preclass-mobile-block">
              <p v-if="attendees && !attendees.length" class="preclass-mobile-member-empty">
                {{ t('Schedule.NoScheduledMembers') }}
              </p>
              <div v-for="user in attendees" :key="user.userId" class="preclass-mobile-member">
                <i>{{ mark(user.userName) }}</i>
                <span>{{ user.userName }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div
        v-show="screen === 'home'"
        class="preclass-mobile-mask"
        :class="{ 'is-open': accountOpen }"
        @click="accountOpen = false"
      />
      <div
        v-show="screen === 'home'"
        class="preclass-mobile-account"
        :class="{ 'is-open': accountOpen, 'is-dragging': accountDragging }"
        :style="accountStyle"
        role="dialog"
        :aria-label="t('Home.Logout')"
        :aria-hidden="!accountOpen"
      >
        <div class="preclass-mobile-handle" @pointerdown="onAccountDragStart">
          <i />
        </div>
        <button class="preclass-mobile-logout" type="button" @click="askLogout">
          {{ t('Home.Logout') }}
        </button>
      </div>

      <TUIDialog
        :open="logoutOpen"
        :title="t('Home.Logout')"
        :confirm-text="t('Home.Logout')"
        :cancel-text="t('Preclass.Cancel')"
        :closable="false"
        :close-on-overlay="false"
        @confirm="emit('logout')"
        @close="logoutOpen = false"
      >
        {{ t('Preclass.LogoutConfirm') }}
      </TUIDialog>
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import {
  IconCheck,
  IconChevronRightMobile,
  IconCopy,
  IconCourseEmpty,
  IconMonitor,
  RoomKitProvider,
  TUIAvatar,
  TUIDialog,
  TUILoading,
  TUISegmented,
  TUIToast,
  t,
} from '@tencentcloud/roomkit-web-vue3';
import type { PickedContact } from '@tencentcloud/roomkit-web-vue3';
import JoinClassForm from '../JoinClassForm.vue';
import ResumeBanner from '../ResumeBanner.vue';
import type { ClassCourse } from '../types';
import { useLinkRoom } from '../useLinkRoom';
import PreclassPreviewMobile from './PreclassPreviewMobile.vue';
import { copyText, inviteText, useCopyFeedback } from '../PreclassPC/schedule/courseCopy';
import { browserTimezoneLabel, formatClock, formatDayLabel, toDateKey } from '../PreclassPC/schedule/scheduleTime';
import { classLink, useClassSchedule } from '../PreclassPC/schedule/useClassSchedule';

const emit = defineEmits<{
  /** Kept so the shared home listener does not fall through onto the root. */
  create: [];
  join: [roomId: string];
  logout: [];
}>();

type Screen = 'home' | 'detail' | 'members';

const tabOptions = computed(() => [
  { value: 'list', label: t('Preclass.CourseList') },
  { value: 'join', label: t('Preclass.Join') },
]);

const { loginUserInfo } = useLoginState();
const userName = computed(() => loginUserInfo.value?.userName || loginUserInfo.value?.userId || '');
const avatarUrl = computed(() => loginUserInfo.value?.avatarUrl || '');

const { courses, isLoaded, fetchAttendees } = useClassSchedule();
const { copied, copy, reset } = useCopyFeedback();

const { linkRoomId, isInviteLink, shouldShowResume, dismissResume } = useLinkRoom();
// A class link lands on the join tab with the id filled in.
const activeTab = ref(isInviteLink.value ? 'join' : 'list');

const screen = ref<Screen>('home');
const selected = ref<ClassCourse>();
const attendeeCache = ref<Record<string, PickedContact[]>>({});
const accountOpen = ref(false);
const accountDragging = ref(false);
const accountOffset = ref(0);
const logoutOpen = ref(false);

const accountStyle = computed(() => (
  accountDragging.value ? { transform: `translateY(${accountOffset.value}px)` } : undefined
));

const groups = computed(() => {
  const buckets = new Map<string, { key: string; label: string; courses: ClassCourse[] }>();
  courses.value.forEach((course) => {
    const date = new Date(course.start * 1000);
    const key = toDateKey(date);
    const bucket = buckets.get(key) ?? { key, label: formatDayLabel(date), courses: [] };
    bucket.courses.push(course);
    buckets.set(key, bucket);
  });
  return [...buckets.values()];
});

const attendees = computed(() => (
  selected.value ? attendeeCache.value[selected.value.roomId] : undefined
));
const faceAttendees = computed(() => (attendees.value ?? []).slice(0, 3));
const memberCount = computed(() => (
  attendees.value ? t('Schedule.AttendeeCount', { count: attendees.value.length }) : '—'
));
const shareLink = computed(() => (selected.value ? classLink(selected.value.roomId) : ''));
const startLabel = computed(() => {
  if (!selected.value) {
    return '';
  }
  return `${formatDayLabel(new Date(selected.value.start * 1000))} ${formatClock(selected.value.start)}`;
});
const durationMinutes = computed(() => (
  selected.value ? Math.max(1, Math.round((selected.value.end - selected.value.start) / 60)) : 0
));

watch(courses, (list) => {
  if (!selected.value) {
    return;
  }
  const next = list.find(course => course.roomId === selected.value?.roomId);
  if (next) {
    selected.value = next;
  }
});

watch(screen, (value) => {
  if (value === 'home') {
    reset();
    accountOpen.value = false;
  }
});

function mark(name: string): string {
  return name.trim().slice(0, 1);
}

async function loadAttendees(roomId: string) {
  if (!roomId || attendeeCache.value[roomId]) {
    return;
  }
  try {
    const list = await fetchAttendees(roomId);
    attendeeCache.value = { ...attendeeCache.value, [roomId]: list };
  } catch (error) {
    console.error('[PreclassMobile] Failed to load class members:', error);
  }
}

async function openDetail(course: ClassCourse) {
  selected.value = course;
  accountOpen.value = false;
  loadAttendees(course.roomId);
  await nextTick();
  screen.value = 'detail';
}

async function copyInvite() {
  if (!selected.value) {
    return;
  }
  const names = (attendees.value ?? []).map(user => user.userName).filter(Boolean).join(t('Schedule.NameSep'));
  const text = [
    inviteText(selected.value, shareLink.value),
    names ? `${t('Preclass.Members')}${t('LabelSep')}${names}` : '',
  ].filter(Boolean).join('\n');
  try {
    await copyText(text);
    TUIToast.success(t('Preclass.Copied'));
  } catch {
    TUIToast.error(t('Preclass.CopyFailed'));
  }
}

function askLogout() {
  accountOpen.value = false;
  logoutOpen.value = true;
}

function onAccountDragStart(event: PointerEvent) {
  if (!accountOpen.value || event.button !== 0) {
    return;
  }
  const sheet = (event.currentTarget as HTMLElement).parentElement;
  if (!sheet) {
    return;
  }
  sheet.setPointerCapture(event.pointerId);
  const startY = event.clientY;
  let lastY = event.clientY;
  let lastTime = performance.now();
  let velocity = 0;
  let dragging = false;

  function move(next: PointerEvent) {
    const now = performance.now();
    velocity = (next.clientY - lastY) / (now - lastTime || 16);
    lastY = next.clientY;
    lastTime = now;
    const raw = next.clientY - startY;
    if (!dragging) {
      if (raw < 8) {
        return;
      }
      dragging = true;
      accountDragging.value = true;
    }
    accountOffset.value = Math.max(0, raw);
  }

  function end() {
    sheet?.removeEventListener('pointermove', move);
    sheet?.removeEventListener('pointerup', end);
    sheet?.removeEventListener('pointercancel', end);
    const dismiss = dragging && (accountOffset.value > 48 || velocity > 0.55);
    accountDragging.value = false;
    accountOffset.value = 0;
    if (dismiss) {
      accountOpen.value = false;
    }
  }

  sheet.addEventListener('pointermove', move);
  sheet.addEventListener('pointerup', end);
  sheet.addEventListener('pointercancel', end);
}
</script>

<style scoped lang="scss" src="./PreclassMobile.scss"></style>
