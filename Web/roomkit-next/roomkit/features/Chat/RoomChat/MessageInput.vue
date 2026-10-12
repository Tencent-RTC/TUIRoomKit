<template>
  <div
    ref="messageInputRef"
    class="message-input"
    :class="{ 'message-input-disabled': disabled }"
  >
    <div class="message-input-toolbar">
      <TUITooltip :content="t('RoomChat.emoji')" :disabled="disabled">
        <TUIPopover
          placement="top-start"
          :disabled="disabled"
          :offset="6"
          :padded="false"
          :reference="messageInputRef"
        >
          <button
            type="button"
            class="message-input-tool"
            :disabled="disabled"
            :aria-label="t('RoomChat.emoji')"
          >
            <IconSmile :size="16" />
          </button>
          <template #content>
            <div class="message-input-emoji">
              <button
                v-for="(char, key) in emojiCharMap"
                :key="key"
                type="button"
                class="message-input-emoji-item"
                @click="insertEmoji(char)"
              >
                {{ char }}
              </button>
            </div>
          </template>
        </TUIPopover>
      </TUITooltip>
      <TUITooltip :content="t('RoomChat.file')" :disabled="disabled">
        <button
          type="button"
          class="message-input-tool"
          :disabled="disabled"
          :aria-label="t('RoomChat.file')"
          @click="pickFile('file')"
        >
          <IconFile :size="16" />
        </button>
      </TUITooltip>
      <TUITooltip :content="t('RoomChat.image')" :disabled="disabled">
        <button
          type="button"
          class="message-input-tool"
          :disabled="disabled"
          :aria-label="t('RoomChat.image')"
          @click="pickFile('image')"
        >
          <IconImage :size="16" />
        </button>
      </TUITooltip>
      <TUITooltip :content="t('RoomChat.video')" :disabled="disabled">
        <button
          type="button"
          class="message-input-tool"
          :disabled="disabled"
          :aria-label="t('RoomChat.video')"
          @click="pickFile('video')"
        >
          <IconChatVideo :size="16" />
        </button>
      </TUITooltip>
    </div>
    <div class="message-input-composer">
      <textarea
        ref="draftRef"
        v-model="draft"
        class="message-input-field"
        rows="1"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        @keydown="onEnter"
        @input="resizeDraft"
      />
      <button
        type="button"
        class="message-input-send"
        :disabled="disabled || !canSend"
        :aria-label="t('RoomChat.send')"
        @click="sendText"
      >
        <IconSend :size="16" />
      </button>
    </div>
    <input
      ref="fileInputRef"
      class="message-input-hidden"
      type="file"
      :accept="accept"
      @change="onFileChange"
    >
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
import { useChatContext } from 'tuikit-atomicx-vue3/chat';
import { IconChatVideo, IconFile, IconImage, IconSend, IconSmile, TUIPopover, TUITooltip, TUIToast } from '../../../base';
import { t } from '../../../base/i18n';
import { emojiCharMap, toSystemEmoji } from './emoji';
import { getSendErrorMessage } from './getSendErrorMessage';
import { useChatComposer } from './useChatComposer';
import type { SendMessagePayload } from 'tuikit-atomicx-vue3/chat';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpg', 'image/jpeg', 'image/gif', 'image/bmp', 'image/png', 'image/webp'];

const props = withDefaults(defineProps<{
  channel?: string;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}>(), {
  channel: 'default',
  disabled: false,
  placeholder: undefined,
  maxLength: 1000,
});

provide('channel', props.channel);

const { sendMessage } = useChatContext(props.channel);
const draft = ref('');
const draftRef = ref<HTMLTextAreaElement | null>(null);
const messageInputRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const pickKind = ref<'file' | 'image' | 'video'>('file');
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
  const start = el?.selectionStart ?? draft.value.length;
  const end = el?.selectionEnd ?? start;
  const next = `${draft.value.slice(0, start)}${char}${draft.value.slice(end)}`;
  draft.value = next.slice(0, props.maxLength);
  nextTick(() => {
    if (!el) {
      return;
    }
    const pos = Math.min(start + char.length, draft.value.length);
    el.focus();
    el.setSelectionRange(pos, pos);
    resizeDraft();
  });
}

function resizeDraft() {
  const el = draftRef.value;
  if (!el) {
    return;
  }
  el.style.height = '34px';
  el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
}

function fillDraft(text: string) {
  draft.value = toSystemEmoji(text).slice(0, props.maxLength);
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
onMounted(() => composer?.register(fillDraft));
onBeforeUnmount(() => composer?.unregister(fillDraft));

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
  // Write accept before click; Vue has not flushed :accept yet, and nextTick
  // would leave the user-gesture so the picker may not open.
  input.accept = acceptFor(kind);
  input.value = '';
  input.click();
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
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
</script>

<style scoped lang="scss">
.message-input {
  display: flex;
  flex-direction: column;
}

.message-input-toolbar {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 6px 12px 0;
  color: var(--rk-text-tertiary);
}

.message-input-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  &:hover:not(:disabled) {
    color: var(--rk-text-primary);
  }
}

.message-input-composer {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px 10px;
  background: var(--rk-bg-surface);
}

.message-input-field {
  flex: 1;
  min-width: 0;
  min-height: 34px;
  max-height: 96px;
  padding: 7px 14px;
  overflow-y: auto;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.4;
  color: var(--rk-text-primary);
  resize: none;
  scrollbar-width: none;
  background: color-mix(in srgb, var(--rk-brand) 1.6%, var(--rk-bg-page));
  border: 0;
  border-radius: 17px;
  outline: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &::placeholder {
    color: var(--rk-text-tertiary);
  }
}

.message-input-disabled .message-input-field {
  color: var(--rk-text-disabled);
}

.message-input-send {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  color: var(--rk-on-accent);
  cursor: pointer;
  background: var(--rk-brand);
  border: 0;
  border-radius: 50%;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.38;
  }
}

.message-input-hidden {
  display: none;
}

.message-input-emoji {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
  gap: 4px;
  width: 336px;
  max-height: 196px;
  padding: 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.message-input-emoji-item {
  width: 100%;
  height: 32px;
  padding: 0;
  font-size: 18px;
  line-height: 32px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--rk-radius-sm);

  &:hover {
    background: var(--rk-bg-hover);
  }
}
</style>
