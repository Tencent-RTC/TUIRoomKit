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
                v-for="char in emojiChars"
                :key="char"
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
import {
  IconChatVideo,
  IconFile,
  IconImage,
  IconSend,
  IconSmile,
  TUIPopover,
  TUITooltip,
  t,
} from '../../../base';
import { useChatInput } from './useChatInput';

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

const {
  emojiChars,
  draft,
  draftRef,
  messageInputRef,
  fileInputRef,
  canSend,
  accept,
  insertEmoji,
  resizeDraft,
  onEnter,
  sendText,
  pickFile,
  onFileChange,
} = useChatInput(props);
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
  font-size: var(--rk-fs-md);
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
  gap: 0;
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
  font-size: var(--rk-fs-xl);
  line-height: 32px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 0;

  &:hover {
    background: var(--rk-bg-hover);
  }
}
</style>
