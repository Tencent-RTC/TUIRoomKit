import { onBeforeUnmount, ref } from 'vue';
import { TUIToast, t } from '@tencentcloud/roomkit-web-vue3';
import { formatRange } from './scheduleTime';
import type { ClassCourse } from './useClassSchedule';

const COPIED_MS = 1600;

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Teleported dialogs can lose document focus, which rejects the async API.
    }
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(input);
  if (!ok) throw new Error('copy failed');
}

/** `copied` holds the key of the last successful copy for a short while. */
export function useCopyFeedback() {
  const copied = ref('');
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy(key: string, text: string) {
    if (!text) return;
    try {
      await copyText(text);
      copied.value = key;
      clearTimeout(timer);
      timer = setTimeout(() => {
        copied.value = '';
      }, COPIED_MS);
    } catch {
      copied.value = '';
      TUIToast.error(t('Preclass.CopyFailed'));
    }
  }

  function reset() {
    clearTimeout(timer);
    copied.value = '';
  }

  onBeforeUnmount(() => clearTimeout(timer));
  return { copied, copy, reset };
}

export function inviteText(course: ClassCourse, link: string): string {
  const sep = t('LabelSep');
  return [
    t('Preclass.InviteTitle', { name: course.teacherName }),
    `${t('Preclass.RoomName')}${sep}${course.title}`,
    `${t('Preclass.ShareTime')}${sep}${formatRange(course.start, course.end)}`,
    `${t('Preclass.RoomId')}${sep}${course.roomId}`,
    `${t('Preclass.ShareLink')}${sep}${link}`,
  ].join('\n');
}
