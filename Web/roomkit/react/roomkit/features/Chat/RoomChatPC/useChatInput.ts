import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MutableRefObject } from 'react';
import { useChatContext } from 'tuikit-atomicx-react/chat';
import type { SendMessagePayload } from 'tuikit-atomicx-react/chat';
import { TUIToast } from '../../../base';
import { t } from '../../../base/i18n';
import { emojiChars } from './emoji';
import { getSendErrorMessage } from './getSendErrorMessage';
import { useChatComposer } from './useChatComposer';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpg', 'image/jpeg', 'image/gif', 'image/bmp', 'image/png', 'image/webp'];

type PickKind = 'file' | 'image' | 'video';

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

export interface ChatInputApi {
  emojiChars: readonly string[];
  draft: string;
  draftRef: MutableRefObject<HTMLTextAreaElement | null>;
  messageInputEl: HTMLDivElement | null;
  setMessageInputEl: (el: HTMLDivElement | null) => void;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  attachOpen: boolean;
  setAttachOpen: (open: boolean) => void;
  canSend: boolean;
  accept: string;
  insertEmoji: (char: string) => void;
  resizeDraft: () => void;
  onEnter: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  sendText: () => Promise<void>;
  pickFile: (kind: PickKind) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  setDraft: (value: string) => void;
}

function acceptFor(kind: PickKind) {
  if (kind === 'image') {
    return IMAGE_TYPES.join(',');
  }
  if (kind === 'video') {
    return '.mp4,.mov,.qt,video/mp4,video/quicktime';
  }
  return '*/*';
}

export function useChatInput(props: ChatInputProps, options: ChatInputOptions = {}): ChatInputApi {
  const focusDraft = options.focusDraft !== false;
  const { sendMessage } = useChatContext(props.channel);
  const [draft, setDraftState] = useState('');
  const draftValueRef = useRef('');
  const draftRef = useRef<HTMLTextAreaElement | null>(null);
  const [messageInputEl, setMessageInputEl] = useState<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pickKind, setPickKindState] = useState<PickKind>('file');
  const pickKindRef = useRef<PickKind>('file');
  const [attachOpen, setAttachOpen] = useState(false);
  const attachOpenRef = useRef(false);
  attachOpenRef.current = attachOpen;
  const canSend = draft.trim().length > 0;
  const accept = acceptFor(pickKind);

  const latestRef = useRef({ disabled: props.disabled, maxLength: props.maxLength });
  latestRef.current = { disabled: props.disabled, maxLength: props.maxLength };
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Runs callbacks after the next commit, like Vue nextTick after a render flush.
  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  const tickQueueRef = useRef<Array<() => void>>([]);
  function nextTick(cb: () => void) {
    tickQueueRef.current.push(cb);
    forceRender();
  }
  useLayoutEffect(() => {
    if (tickQueueRef.current.length === 0) {
      return;
    }
    const queue = tickQueueRef.current.splice(0);
    queue.forEach(cb => cb());
  });

  function setDraft(value: string) {
    draftValueRef.current = value;
    setDraftState(value);
  }

  function resizeDraft() {
    const el = draftRef.current;
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
      const { current } = draftRef;
      if (current !== field) {
        return;
      }
      current.scrollTop = current.scrollHeight;
    };
    pin();
    // The draft resize runs again in a later tick and iOS drops a
    // synchronous scrollTop write on a blurred field. Pin once more after layout.
    requestAnimationFrame(pin);
  }

  function insertEmoji(char: string) {
    if (latestRef.current.disabled) {
      return;
    }
    const el = draftRef.current;
    const { current } = draftValueRef;
    const start = focusDraft ? (el?.selectionStart ?? current.length) : current.length;
    const end = focusDraft ? (el?.selectionEnd ?? start) : start;
    const next = `${current.slice(0, start)}${char}${current.slice(end)}`;
    setDraft(next.slice(0, latestRef.current.maxLength));
    nextTick(() => {
      if (!el) {
        return;
      }
      resizeDraft();
      if (!focusDraft) {
        revealDraftEnd(el);
        return;
      }
      const pos = Math.min(start + char.length, draftValueRef.current.length);
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function fillDraft(text: string) {
    setDraft(text.slice(0, latestRef.current.maxLength));
    optionsRef.current.prepareFocus?.();
    nextTick(() => {
      const el = draftRef.current;
      if (!el) return;
      resizeDraft();
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  }

  const fillDraftRef = useRef(fillDraft);
  fillDraftRef.current = fillDraft;
  const [stableFillDraft] = useState(() => (text: string) => fillDraftRef.current(text));

  const composer = useChatComposer();
  useEffect(() => {
    composer?.register(stableFillDraft);
    return () => composer?.unregister(stableFillDraft);
  }, [composer, stableFillDraft]);

  // Attach picker tracking. The menu stays up while the system picker is open,
  // then closes on cancel or on a chosen file. `cancel` covers the dismiss; blur
  // and visibility cover browsers that only report the page leaving and coming back.
  const picker = useRef({
    settled: true,
    timer: 0,
    release: undefined as (() => void) | undefined,
  }).current;

  function closeAttachPicker() {
    if (picker.settled) {
      return;
    }
    picker.settled = true;
    window.clearTimeout(picker.timer);
    setAttachOpen(false);
    picker.release?.();
    picker.release = undefined;
  }

  function watchPickerDismiss(input: HTMLInputElement) {
    picker.release?.();
    picker.settled = false;
    let away = false;
    const finish = () => {
      window.clearTimeout(picker.timer);
      picker.timer = window.setTimeout(() => closeAttachPicker(), 0);
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
    picker.release = () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      input.removeEventListener('cancel', onCancel);
    };
  }

  useEffect(() => () => {
    picker.settled = true;
    window.clearTimeout(picker.timer);
    picker.release?.();
    picker.release = undefined;
  }, [picker]);

  function onEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    void sendText();
  }

  async function sendText() {
    const text = draftValueRef.current.trim();
    if (latestRef.current.disabled || !text) {
      return;
    }
    setDraft('');
    try {
      await sendMessage({ type: 'textMessage', text });
    } catch (error) {
      TUIToast.error(getSendErrorMessage(error));
    }
  }

  const draftFirstRunRef = useRef(true);
  useLayoutEffect(() => {
    if (draftFirstRunRef.current) {
      draftFirstRunRef.current = false;
      return;
    }
    nextTick(resizeDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function pickFile(kind: PickKind) {
    if (latestRef.current.disabled) {
      return;
    }
    pickKindRef.current = kind;
    setPickKindState(kind);
    const input = fileInputRef.current;
    if (!input) {
      return;
    }
    const keepAttachOpen = attachOpenRef.current;
    // Write accept before click; React has not committed `accept` yet, and waiting
    // would leave the user-gesture so the picker may not open.
    input.accept = acceptFor(kind);
    input.value = '';
    if (keepAttachOpen) {
      watchPickerDismiss(input);
    } else {
      setAttachOpen(false);
    }
    input.click();
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    closeAttachPicker();
    if (!file || latestRef.current.disabled) {
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      TUIToast.error(t('RoomChat.file_too_large'));
      return;
    }
    if (pickKindRef.current === 'image' && !IMAGE_TYPES.includes(file.type)) {
      TUIToast.error(t('RoomChat.invalid_image'));
      return;
    }
    let payload: SendMessagePayload = { type: 'fileMessage', file };
    if (pickKindRef.current === 'image') {
      payload = { type: 'imageMessage', file };
    } else if (pickKindRef.current === 'video') {
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
    messageInputEl,
    setMessageInputEl,
    fileInputRef,
    attachOpen,
    setAttachOpen,
    canSend,
    accept,
    insertEmoji,
    resizeDraft,
    onEnter,
    sendText,
    pickFile,
    onFileChange,
    setDraft,
  };
}
