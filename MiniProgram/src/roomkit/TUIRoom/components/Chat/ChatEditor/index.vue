<template>
  <div
    :class="[
      'chat-editor',
      { 'disable-editor': isMessageDisabled },
      { 'chat-editor--keyboard': keyboardHeight > 0 },
    ]"
    :style="{ paddingBottom: `${keyboardHeight}px` }"
  >
    <div class="chat-input-bar">
      <div class="input-content">
        <input
          ref="editorInputEle"
          v-model="sendMsg"
          type="text"
          :disabled="isMessageDisabled"
          class="content-bottom-input"
          :placeholder="
            isMessageDisabled
              ? t('Muted by the moderator')
              : t('Type a message')
          "
          confirm-type="send"
          :adjust-position="false"
          enterkeyhint="send"
          @keyboardheightchange="handleKeyboardHeightChange"
          @confirm="sendMessage"
          @keyup.enter="sendMessage"
        />
      </div>
      <div class="chat-actions">
        <svg-icon
          :icon="EmojiIcon"
          :class="[
            'action-btn',
            { 'action-btn--active': isEmojiToolbarVisible },
            { 'action-btn--disabled': isMessageDisabled },
          ]"
          @tap="toggleEmojiPanel"
        />
        <svg-icon
          v-if="!hasSendContent"
          :icon="PlusIcon"
          :class="[
            'action-btn',
            { 'action-btn--active': isActionPanelVisible },
            { 'action-btn--disabled': isMessageDisabled },
          ]"
          @tap="toggleActionPanel"
        />
        <span v-else class="send" @tap="sendMessage">{{ t('Send') }}</span>
      </div>
    </div>
    <emoji
      v-if="showEmojiPanel"
      class="chat-emoji"
      @choose-emoji="handleChooseEmoji"
    />
    <div v-if="showActionPanel" class="action-panel">
      <div class="action-grid">
        <div class="action-item" @tap="chooseImage">
          <div class="action-icon-wrapper">
            <svg-icon
              style="display: flex"
              :icon="ImageIcon"
              :size="28"
              class="action-icon"
            />
          </div>
          <span class="action-label">{{ t('Image') }}</span>
        </div>
        <div class="action-item" @tap="chooseFile">
          <div class="action-icon-wrapper">
            <svg-icon
              style="display: flex"
              :icon="FileIcon"
              :size="28"
              class="action-icon"
            />
          </div>
          <span class="action-label">{{ t('File') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import emoji from '../EditorTools/index.vue';
import useChatEditor from './useChatEditor';
import SvgIcon from '../../common/base/SvgIcon.vue';
import EmojiIcon from '../../../assets/icons/EmojiIcon.svg';
import PlusIcon from '../../../assets/icons/PlusIcon.svg';
import ImageIcon from '../../../assets/icons/ImageIcon.svg';
import FileIcon from '../../../assets/icons/FileIcon.svg';

const {
  t,
  editorInputEle,
  sendMsg,
  hasSendContent,
  keyboardHeight,
  handleKeyboardHeightChange,
  isEmojiToolbarVisible,
  isActionPanelVisible,
  showEmojiPanel,
  showActionPanel,
  isMessageDisabled,
  sendMessage,
  chooseImage,
  chooseFile,
  handleChooseEmoji,
  toggleEmojiPanel,
  toggleActionPanel,
} = useChatEditor();
</script>

<style lang="scss" scoped>
.chat-editor {
  background-color: var(--bg-color-operate);
}

.chat-input-bar {
  display: flex;
  align-items: flex-end;
  padding: 12px 12px 20px;
}

.chat-editor--keyboard .chat-input-bar {
  padding-bottom: 12px;
}

.input-content {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
  margin-right: 8px;
  border-radius: 16px;
  background-color: var(--bg-color-input);
}

.content-bottom-input {
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  font-family: 'PingFang SC';
  font-size: 16px;
  font-weight: 450;
  line-height: 24px;
  border: none;
  border-radius: 16px;
  background-color: transparent;
  color: var(--text-color-primary);

  ::placeholder {
    font-weight: 400;
    color: var(--text-color-secondary);
  }

  &:focus-visible {
    outline: none;
  }
}

.chat-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  padding-bottom: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--text-color-secondary);
}

.action-btn + .action-btn,
.action-btn + .send {
  margin-left: 4px;
}

.action-btn--active {
  color: var(--text-color-link);
}

.action-btn--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.send {
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--text-color-link);
}

.chat-emoji {
  width: 100%;
  height: 200px;
}

.action-panel {
  box-sizing: border-box;
  height: 220px;
  padding: 20px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  font-size: 0;
  line-height: 0;
  border-radius: 12px;
  background-color: var(--bg-color-input);
}

.action-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  font-size: 0;
  line-height: 0;
  color: var(--text-color-primary);
}

.action-label {
  margin-top: 8px;
  font-size: 12px;
  line-height: 16px;
  color: var(--text-color-secondary);
}
</style>
