import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { SendMessagePayload } from 'tuikit-atomicx-vue3/chat';
import { useChatContext } from 'tuikit-atomicx-vue3/chat';
import { TUIToast, t } from '../../../base';
import { emojiChars } from './emoji';
import { getSendErrorMessage } from './getSendErrorMessage';
import { useChatComposer } from './useChatComposer';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpg', 'image/jpeg', 'image/gif', 'image/bmp', 'image/png', 'image/webp'];

export interface ChatInputProps {
  readonly channel: string;
  readonly disabled: boolean;
  readonly placeholder?: string;
  readonly maxLength: number;
}

export interface ChatInputOptions {
  /**
   * Place the caret after an emoji.
   * Mobile appends the character, scrolls to that line, and leaves the keyboard alone.
   */
  focusDraft?: boolean;
  /** Runs inside the re-edit gesture, before the field is focused. */
  prepareFocus?: () => void;
}

export function useChatInput(props: ChatInputProps, options: ChatInputOptions = {}) {
  const focusDraft = options.focusDraft !== false;
  const { sendMessage } = useChatContext(props.channel);
  const draft = ref('');
  const draftRef = ref<HTMLTextAreaElement | null>(null);
  const messageInputRef = ref<HTMLElement | null>(null);
  const fileInputRef = ref<HTMLInputElement | null>(null);
  const pickKind = ref<'file' | 'image' | 'video'>('file');
  const attachOpen = ref(false);
  const canSend = computed(() => draft.value.trim().length > 0);

  function acceptFor(kind: 'file' | 'image' | 'video') {
    if (kind === 'image') {
      return IMAGE_TYPES.join(',');
    }
    if (kind === 'video') {
      return '.mp4,.mov,.qt,video/mp4,video/quicktime';
    }
    return '*/*';
  }

  const accept = computed(() => acceptFor(pickKind.value));

  function insertEmoji(char: string) {
    if (props.disabled) {
      return;
    }
    const el = draftRef.value;
    const start = focusDraft ? (el?.selectionStart ?? draft.value.length) : draft.value.length;
    const end = focusDraft ? (el?.selectionEnd ?? start) : start;
    const next = `${draft.value.slice(0, start)}${char}${draft.value.slice(end)}`;
    draft.value = next.slice(0, props.maxLength);
    nextTick(() => {
      if (!el) {
        return;
      }
      resizeDraft();
      if (!focusDraft) {
        revealDraftEnd(el);
        return;
      }
      const pos = Math.min(start + char.length, draft.value.length);
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function resizeDraft() {
    const el = draftRef.value;
    if (!el) {
      return;
    }
    // Collapsing the field clears scrollTop. Keep the end in view when the
    // caret was already there; otherwise put the previous offset back.
    const { scrollTop, scrollHeight, clientHeight } = el;
    const pinnedToEnd = scrollHeight - scrollTop - clientHeight <= 1;
    el.style.height = '34px';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
    el.scrollTop = pinnedToEnd ? el.scrollHeight : scrollTop;
  }

  function revealDraftEnd(field: HTMLTextAreaElement) {
    const pin = () => {
      const current = draftRef.value;
      if (current !== field) {
        return;
      }
      current.scrollTop = current.scrollHeight;
    };
    pin();
    // The draft watcher resizes again in a later tick and iOS drops a
    // synchronous scrollTop write on a blurred field. Pin once more after layout.
    requestAnimationFrame(pin);
  }

  function fillDraft(text: string) {
    draft.value = text.slice(0, props.maxLength);
    options.prepareFocus?.();
    nextTick(() => {
      const el = draftRef.value;
      if (!el) return;
      resizeDraft();
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  }

  const composer = useChatComposer();
  let releasePickerWatch: (() => void) | undefined;
  let pickerTimer = 0;
  let pickerSettled = true;

  function closeAttachPicker() {
    if (pickerSettled) {
      return;
    }
    pickerSettled = true;
    window.clearTimeout(pickerTimer);
    attachOpen.value = false;
    releasePickerWatch?.();
    releasePickerWatch = undefined;
  }

  /* The menu stays up while the system picker is open, then closes on cancel or
     on a chosen file. `cancel` covers the dismiss; blur and visibility cover
     browsers that only report the page leaving and coming back. */
  function watchPickerDismiss(input: HTMLInputElement) {
    releasePickerWatch?.();
    pickerSettled = false;
    let away = false;
    const finish = () => {
      window.clearTimeout(pickerTimer);
      pickerTimer = window.setTimeout(closeAttachPicker, 0);
    };
    const onBlur = () => {
      away = true;
    };
    const onFocus = () => {
      if (away) finish();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        away = true;
        return;
      }
      if (away) finish();
    };
    const onCancel = () => closeAttachPicker();
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    input.addEventListener('cancel', onCancel);
    releasePickerWatch = () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      input.removeEventListener('cancel', onCancel);
    };
  }

  onMounted(() => composer?.register(fillDraft));
  onBeforeUnmount(() => {
    composer?.unregister(fillDraft);
    pickerSettled = true;
    window.clearTimeout(pickerTimer);
    releasePickerWatch?.();
    releasePickerWatch = undefined;
  });

  function onEnter(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
      return;
    }
    event.preventDefault();
    sendText();
  }

  async function sendText() {
    const text = draft.value.trim();
    if (props.disabled || !text) {
      return;
    }
    draft.value = '';
    try {
      await sendMessage({ type: 'textMessage', text });
    } catch (error) {
      TUIToast.error(getSendErrorMessage(error));
    }
  }

  watch(draft, () => nextTick(resizeDraft));

  function pickFile(kind: 'file' | 'image' | 'video') {
    if (props.disabled) {
      return;
    }
    pickKind.value = kind;
    const input = fileInputRef.value;
    if (!input) {
      return;
    }
    const keepAttachOpen = attachOpen.value;
    // Write accept before click; Vue has not flushed :accept yet, and nextTick
    // would leave the user-gesture so the picker may not open.
    input.accept = acceptFor(kind);
    input.value = '';
    if (keepAttachOpen) {
      watchPickerDismiss(input);
    } else {
      attachOpen.value = false;
    }
    input.click();
  }

  async function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    closeAttachPicker();
    if (!file || props.disabled) {
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      TUIToast.error(t('RoomChat.file_too_large'));
      return;
    }
    if (pickKind.value === 'image' && !IMAGE_TYPES.includes(file.type)) {
      TUIToast.error(t('RoomChat.invalid_image'));
      return;
    }
    let payload: SendMessagePayload = { type: 'fileMessage', file };
    if (pickKind.value === 'image') {
      payload = { type: 'imageMessage', file };
    } else if (pickKind.value === 'video') {
      payload = { type: 'videoMessage', file, duration: 0 };
    }
    try {
      await sendMessage(payload);
    } catch (error) {
      TUIToast.error(getSendErrorMessage(error));
    }
  }

  return {
    emojiChars,
    draft,
    draftRef,
    messageInputRef,
    fileInputRef,
    attachOpen,
    canSend,
    accept,
    insertEmoji,
    resizeDraft,
    onEnter,
    sendText,
    pickFile,
    onFileChange,
  };
}
