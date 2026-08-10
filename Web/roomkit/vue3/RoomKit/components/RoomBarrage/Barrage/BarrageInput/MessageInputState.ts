import { nextTick, ref } from 'vue';
import type { Ref } from 'vue';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import { BarrageType } from '../types';
import { useBarrageState } from '../useBarrageState';
import type { OnWillSendBarrage, OnDidSendBarrage, Barrage } from '../types';

interface MessageInputState {
  inputRawValue: Ref<string>;
}

interface SendHooks {
  onWillSendBarrage?: OnWillSendBarrage;
  onDidSendBarrage?: OnDidSendBarrage;
}

interface MessageInputAction {
  updateRawValue: (value: string) => void;
  setTextareaElement: (el: HTMLTextAreaElement | null) => void;
  saveSelection: (start?: number, end?: number) => void;
  setContent: (value: string) => void;
  insertContent: (value: string, focus?: boolean) => void;
  focusEditor: () => void;
  blurEditor: () => void;
  sendMessage: (msg?: string) => Promise<void>;
  setSendHooks: (instanceId: string, hooks: SendHooks) => void;
  clearSendHooks: (instanceId: string) => void;
}

const { loginUserInfo } = useLoginState();

const textareaEl = ref<HTMLTextAreaElement | null>(null);
const inputRawValue = ref('');
const selectionStart = ref(0);
const selectionEnd = ref(0);
let ignoreSelectionSave = false;

const sendHooksMap = new Map<string, SendHooks>();

const setSendHooks = (instanceId: string, hooks: SendHooks) => {
  sendHooksMap.set(instanceId, hooks);
};

const clearSendHooks = (instanceId: string) => {
  sendHooksMap.delete(instanceId);
};

const updateRawValue = (value: string) => {
  inputRawValue.value = typeof value === 'string' ? value : '';
};

const setTextareaElement = (el: HTMLTextAreaElement | null) => {
  textareaEl.value = el;
};

const saveSelection = (start?: number, end?: number) => {
  if (ignoreSelectionSave) {
    return;
  }
  const el = textareaEl.value;
  if (typeof start === 'number' && typeof end === 'number') {
    selectionStart.value = start;
    selectionEnd.value = end;
    return;
  }
  if (!el) {
    return;
  }
  selectionStart.value = el.selectionStart ?? inputRawValue.value.length;
  selectionEnd.value = el.selectionEnd ?? inputRawValue.value.length;
};

const setContent = (content: string) => {
  ignoreSelectionSave = true;
  inputRawValue.value = content;
  selectionStart.value = content.length;
  selectionEnd.value = content.length;
  nextTick(() => {
    const el = textareaEl.value;
    if (el) {
      el.value = content;
      const pos = content.length;
      el.setSelectionRange(pos, pos);
    }
    requestAnimationFrame(() => {
      ignoreSelectionSave = false;
    });
  });
};

const insertContent = (text: string, focus = true) => {
  if (!text) {
    return;
  }

  const el = textareaEl.value;
  const current = inputRawValue.value;
  const maxLen = el && el.maxLength > 0 ? el.maxLength : Number.POSITIVE_INFINITY;

  // Always use the saved caret. After a controlled `:value` update Vue may
  // reset the native selection to 0, so reading selectionStart live on the
  // next emoji click would insert at the beginning.
  const start = Math.max(0, Math.min(selectionStart.value, current.length));
  const end = Math.max(start, Math.min(selectionEnd.value, current.length));

  let next = current.slice(0, start) + text + current.slice(end);
  if (next.length > maxLen) {
    next = next.slice(0, maxLen);
  }

  ignoreSelectionSave = true;
  inputRawValue.value = next;

  const caret = Math.min(start + text.length, next.length);
  selectionStart.value = caret;
  selectionEnd.value = caret;

  nextTick(() => {
    if (el) {
      if (focus) {
        el.focus();
      }
      el.setSelectionRange(caret, caret);
    }
    requestAnimationFrame(() => {
      ignoreSelectionSave = false;
    });
  });
};

const focusEditor = () => {
  const el = textareaEl.value;
  if (!el) {
    return;
  }
  el.focus();
  const start = Math.max(0, Math.min(selectionStart.value, el.value.length));
  const end = Math.max(start, Math.min(selectionEnd.value, el.value.length));
  el.setSelectionRange(start, end);
};

const blurEditor = () => {
  textareaEl.value?.blur();
};

function useMessageInputState(roomId?: string): MessageInputState & MessageInputAction {
  const { sendTextMessage } = useBarrageState(roomId);

  const buildSendBarrage = (text: string, extensionInfo?: Record<string, string>): Barrage => ({
    roomId: roomId || '',
    sender: {
      userId: loginUserInfo.value?.userId || '',
      userName: loginUserInfo.value?.userName || '',
      nameCard: '',
      avatarUrl: loginUserInfo.value?.avatarUrl || '',
    },
    sequence: 0,
    timestampInSecond: Math.floor(Date.now() / 1000),
    messageType: BarrageType.text,
    textContent: text,
    extensionInfo: extensionInfo ?? null,
  });

  const sendMessage = async (msg?: string) => {
    const messageToSend = (msg ?? inputRawValue.value).trim();
    if (!messageToSend) {
      return;
    }

    const sendTextWithHooks = async (text: string) => {
      const barrage = buildSendBarrage(text);

      const sendHooksMapSnapshot = [...sendHooksMap.values()];

      for (const hooks of sendHooksMapSnapshot) {
        if (hooks.onWillSendBarrage) {
          try {
            const allowed = await hooks.onWillSendBarrage(barrage);
            if (allowed === false) {
              setContent(messageToSend);
              return;
            }
          } catch (error) {
            console.error('[BarrageInput] onWillSendBarrage callback error:', error);
          }
        }
      }

      await sendTextMessage({ text });

      for (const hooks of sendHooksMapSnapshot) {
        if (hooks.onDidSendBarrage) {
          try {
            hooks.onDidSendBarrage(barrage);
          } catch (error) {
            console.error('[BarrageInput] onDidSendBarrage callback error:', error);
          }
        }
      }
    };

    await sendTextWithHooks(messageToSend);
  };

  return {
    inputRawValue,
    updateRawValue,
    setTextareaElement,
    saveSelection,
    setContent,
    insertContent,
    focusEditor,
    blurEditor,
    sendMessage,
    setSendHooks,
    clearSendHooks,
  };
}

export { useMessageInputState };
