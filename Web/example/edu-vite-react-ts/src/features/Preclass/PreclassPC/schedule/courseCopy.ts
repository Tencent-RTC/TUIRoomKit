import { useCallback, useEffect, useRef, useState } from 'react';
import { TUIToast, t } from '@tencentcloud/roomkit-web-react';
import { formatRange } from './scheduleTime';
import type { ClassCourse } from '../../types';

const COPIED_MS = 1600;

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Dialogs can lose document focus, rejecting the async clipboard API.
    }
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();
  const isCopied = document.execCommand('copy');
  document.body.removeChild(input);
  if (!isCopied) throw new Error('copy failed');
}

export function useCopyFeedback() {
  const [copied, setCopied] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  async function copy(key: string, text: string) {
    if (!text) return;
    try {
      await copyText(text);
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(''), COPIED_MS);
    } catch {
      setCopied('');
      TUIToast.error(t('Preclass.CopyFailed'));
    }
  }
  const reset = useCallback(() => {
    clearTimeout(timer.current);
    setCopied('');
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
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
