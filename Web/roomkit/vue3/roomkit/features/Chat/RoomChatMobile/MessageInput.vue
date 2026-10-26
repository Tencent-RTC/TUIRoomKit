<template>
  <div
    ref="messageInputRef"
    class="message-input"
    :class="{ 'message-input-disabled': disabled }"
  >
    <div class="message-input-tools">
      <TUIPopover
        v-model:open="emojiOpen"
        placement="top-start"
        :disabled="disabled"
        :offset="12"
        :padded="false"
        :reference="messageInputRef"
      >
        <button
          type="button"
          class="message-input-tool"
          :disabled="disabled"
          :aria-label="t('RoomChat.emoji')"
          @pointerdown="onEmojiPointerDown"
          @click.prevent.stop
        >
          <IconSmileMobile :size="16" />
        </button>
        <template #content>
          <div class="message-input-emoji">
            <button
              v-for="char in emojiChars"
              :key="char"
              type="button"
              class="message-input-emoji-item"
              @pointerdown.prevent.stop="insertEmoji(char)"
              @click.prevent.stop
            >
              {{ char }}
            </button>
          </div>
        </template>
      </TUIPopover>
      <TUIPopover
        v-model:open="attachOpen"
        placement="top-start"
        :disabled="disabled"
        :offset="12"
        :padded="false"
      >
        <button
          type="button"
          class="message-input-tool"
          :disabled="disabled"
          :aria-label="t('RoomChat.attachment')"
        >
          <IconPaperclip :size="16" />
        </button>
        <template #content>
          <div class="message-input-attach">
            <button type="button" class="message-input-attach-item" @click="pickFile('image')">
              <IconImageMobile :size="16" />
              <span>{{ t('RoomChat.image') }}</span>
            </button>
            <button type="button" class="message-input-attach-item" @click="pickFile('video')">
              <IconChatVideo :size="16" />
              <span>{{ t('RoomChat.video') }}</span>
            </button>
            <button type="button" class="message-input-attach-item" @click="pickFile('file')">
              <IconFileMobile :size="16" />
              <span>{{ t('RoomChat.file') }}</span>
            </button>
          </div>
        </template>
      </TUIPopover>
    </div>
    <div class="message-input-composer">
      <textarea
        ref="draftRef"
        v-model="draft"
        class="message-input-field"
        rows="1"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="!keyboardArmed"
        :inputmode="keyboardArmed ? 'text' : 'none'"
        :maxlength="maxLength"
        @pointerdown="onDraftPointerDown"
        @focus="onDraftFocus"
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
import { onMounted, ref, watch } from 'vue';
import {
  IconChatVideo,
  IconFileMobile,
  IconImageMobile,
  IconPaperclip,
  IconSend,
  IconSmileMobile,
  TUIPopover,
  t,
} from '../../../base';
import { useChatInput } from '../RoomChatPC/useChatInput';

const props = withDefaults(defineProps<{
  channel?: string;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  active?: boolean;
}>(), {
  channel: 'default',
  disabled: false,
  placeholder: undefined,
  maxLength: 1000,
  active: false,
});

const emojiOpen = ref(false);
const keyboardArmed = ref(false);

const {
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
} = useChatInput(props, {
  focusDraft: false,
  prepareFocus() {
    emojiOpen.value = false;
    armKeyboard();
  },
});

function disarmKeyboard() {
  keyboardArmed.value = false;
  const el = draftRef.value;
  if (!el) return;
  el.readOnly = true;
  el.inputMode = 'none';
  el.blur();
}

function armKeyboard() {
  const el = draftRef.value;
  keyboardArmed.value = true;
  if (!el) return;
  el.readOnly = false;
  el.inputMode = 'text';
  el.focus();
  const end = el.value.length;
  el.setSelectionRange(end, end);
}

function releaseKeyboard() {
  emojiOpen.value = false;
  disarmKeyboard();
}

function onEmojiPointerDown(event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();
  if (props.disabled) return;
  const next = !emojiOpen.value;
  emojiOpen.value = next;
  if (next) disarmKeyboard();
}

function onDraftPointerDown() {
  if (keyboardArmed.value && !emojiOpen.value) return;
  if (!draftRef.value || props.disabled) return;
  emojiOpen.value = false;
  armKeyboard();
}

function onDraftFocus() {
  if (draftRef.value?.readOnly) {
    draftRef.value.blur();
  }
}

onMounted(releaseKeyboard);
watch(() => props.active, (active) => {
  if (active) {
    releaseKeyboard();
    return;
  }
  emojiOpen.value = false;
  disarmKeyboard();
});
</script>

<style scoped lang="scss">
.message-input {
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: flex-end;
  padding: 8px 16px 12px 8px;
  touch-action: manipulation;
  border-top: 1px solid var(--rk-border);
}

.message-input-disabled {
  opacity: 0.6;
}

.message-input-tools {
  display: flex;
  flex: none;
  gap: 6px;
  align-items: center;
  height: 34px;
  color: var(--rk-text-tertiary);
}

.message-input-tool {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;

  /* The glyph stays 16px. The hit area fills the bar padding and the gap between the two tools. */
  &::before {
    position: absolute;
    inset: -8px -5px;
    content: '';
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
}

.message-input-composer {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: flex-end;
  min-width: 0;
}

.message-input-field {
  flex: 1;
  min-width: 0;
  min-height: 34px;
  max-height: 96px;
  padding: 7px 14px;
  overflow-y: auto;
  font-family: inherit;
  font-size: var(--rk-fs-md);
  line-height: 1.4;
  color: var(--rk-text-primary);
  resize: none;
  scrollbar-width: none;
  background: color-mix(in srgb, var(--rk-text-primary) 6%, transparent);
  border: 0;
  border-radius: 17px;
  outline: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &::placeholder {
    color: var(--rk-text-tertiary);
  }

  &:read-only {
    caret-color: transparent;
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

  &:hover:not(:disabled) {
    filter: brightness(1.06);
  }
}

.message-input-hidden {
  display: none;
}

.message-input-emoji {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
  gap: 0;
  width: calc(100vw - 32px);
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
  font-size: var(--rk-fs-xl);
  line-height: 32px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 0;
  -webkit-tap-highlight-color: transparent;

  @media (hover: hover) {
    &:hover {
      background: var(--rk-bg-hover);
    }
  }
}

.message-input-attach {
  display: flex;
  flex-direction: column;
  width: max-content;
  min-width: 132px;
  padding: 6px;
}

.message-input-attach-item {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 36px;
  padding: 6px 12px;
  font-size: var(--rk-fs-md);
  font-weight: 500;
  color: var(--rk-text-primary);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.message-input-attach-item :deep(.rk-icon) {
  color: var(--rk-text-secondary);
}

.message-input-attach-item:hover,
.message-input-attach-item:active {
  background: var(--rk-bg-hover);
}
</style>
