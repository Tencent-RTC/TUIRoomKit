import type { CSSProperties, ChangeEvent } from 'react';
import {
  IconChatVideo,
  IconFile,
  IconImage,
  IconSend,
  IconSmile,
  TUIPopover,
  TUITooltip,
} from '../../../base';
import { t, useI18n } from '../../../base/i18n';
import { useChatInput } from './useChatInput';
import './MessageInput.scss';

export interface MessageInputProps {
  channel?: string;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  style?: CSSProperties;
}

export function MessageInput(props: MessageInputProps) {
  const {
    channel = 'default',
    disabled = false,
    placeholder = undefined,
    maxLength = 1000,
    className,
    style,
  } = props;

  useI18n();
  const {
    emojiChars,
    draft,
    draftRef,
    messageInputEl,
    setMessageInputEl,
    fileInputRef,
    canSend,
    accept,
    insertEmoji,
    resizeDraft,
    onEnter,
    sendText,
    pickFile,
    onFileChange,
    setDraft,
  } = useChatInput({ channel, disabled, placeholder, maxLength });

  function onDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
    resizeDraft();
  }

  return (
    <div
      ref={setMessageInputEl}
      className={['message-input', disabled ? 'message-input-disabled' : '', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="message-input-toolbar">
        <TUITooltip content={t('RoomChat.emoji')} disabled={disabled}>
          <TUIPopover
            placement="top-start"
            disabled={disabled}
            offset={6}
            padded={false}
            reference={messageInputEl}
            contentSlot={(
              <div className="message-input-emoji">
                {emojiChars.map(char => (
                  <button
                    key={char}
                    type="button"
                    className="message-input-emoji-item"
                    onClick={() => insertEmoji(char)}
                  >
                    {char}
                  </button>
                ))}
              </div>
            )}
          >
            <button
              type="button"
              className="message-input-tool"
              disabled={disabled}
              aria-label={t('RoomChat.emoji')}
            >
              <IconSmile size={16} />
            </button>
          </TUIPopover>
        </TUITooltip>
        <TUITooltip content={t('RoomChat.file')} disabled={disabled}>
          <button
            type="button"
            className="message-input-tool"
            disabled={disabled}
            aria-label={t('RoomChat.file')}
            onClick={() => pickFile('file')}
          >
            <IconFile size={16} />
          </button>
        </TUITooltip>
        <TUITooltip content={t('RoomChat.image')} disabled={disabled}>
          <button
            type="button"
            className="message-input-tool"
            disabled={disabled}
            aria-label={t('RoomChat.image')}
            onClick={() => pickFile('image')}
          >
            <IconImage size={16} />
          </button>
        </TUITooltip>
        <TUITooltip content={t('RoomChat.video')} disabled={disabled}>
          <button
            type="button"
            className="message-input-tool"
            disabled={disabled}
            aria-label={t('RoomChat.video')}
            onClick={() => pickFile('video')}
          >
            <IconChatVideo size={16} />
          </button>
        </TUITooltip>
      </div>
      <div className="message-input-composer">
        <textarea
          ref={draftRef}
          value={draft}
          className="message-input-field"
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          onKeyDown={onEnter}
          onChange={onDraftChange}
        />
        <button
          type="button"
          className="message-input-send"
          disabled={disabled || !canSend}
          aria-label={t('RoomChat.send')}
          onClick={sendText}
        >
          <IconSend size={16} />
        </button>
      </div>
      <input
        ref={fileInputRef}
        className="message-input-hidden"
        type="file"
        accept={accept}
        onChange={onFileChange}
      />
    </div>
  );
}

export default MessageInput;
