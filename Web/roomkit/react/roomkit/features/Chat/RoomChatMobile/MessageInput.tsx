import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ChangeEvent, MouseEvent, PointerEvent } from 'react';
import {
  IconChatVideo,
  IconFileMobile,
  IconImageMobile,
  IconPaperclip,
  IconSend,
  IconSmileMobile,
  TUIPopover,
} from '../../../base';
import { t, useI18n } from '../../../base/i18n';
import { useChatInput } from '../RoomChatPC/useChatInput';
import './MessageInput.scss';

export interface MessageInputProps {
  channel?: string;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  /** Chat sheet is on screen. Opening it must not raise the keyboard. */
  active?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function MessageInput(props: MessageInputProps) {
  const {
    channel = 'default',
    disabled = false,
    placeholder = undefined,
    maxLength = 1000,
    active = false,
    className,
    style,
  } = props;

  useI18n();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [keyboardArmed, setKeyboardArmed] = useState(false);
  const emojiOpenRef = useRef(false);
  const keyboardArmedRef = useRef(false);

  const {
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
  } = useChatInput({ channel, disabled, placeholder, maxLength }, {
    focusDraft: false,
    prepareFocus() {
      setEmojiOpenValue(false);
      armKeyboard();
    },
  });

  function setEmojiOpenValue(next: boolean) {
    emojiOpenRef.current = next;
    setEmojiOpen(next);
  }

  function disarmKeyboard() {
    keyboardArmedRef.current = false;
    setKeyboardArmed(false);
    const el = draftRef.current;
    if (!el) return;
    el.readOnly = true;
    el.inputMode = 'none';
    el.blur();
  }

  function armKeyboard() {
    keyboardArmedRef.current = true;
    setKeyboardArmed(true);
    const el = draftRef.current;
    if (!el) return;
    el.readOnly = false;
    el.inputMode = 'text';
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }

  function releaseKeyboard() {
    setEmojiOpenValue(false);
    disarmKeyboard();
  }

  function onEmojiPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    const next = !emojiOpenRef.current;
    setEmojiOpenValue(next);
    if (next) disarmKeyboard();
  }

  function onEmojiClickCapture(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function onDraftPointerDown() {
    if (keyboardArmedRef.current && !emojiOpenRef.current) return;
    if (!draftRef.current || disabled) return;
    setEmojiOpenValue(false);
    armKeyboard();
  }

  function onDraftFocus() {
    if (draftRef.current?.readOnly) {
      draftRef.current.blur();
    }
  }

  function onDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
    resizeDraft();
  }

  // Vue mounts with releaseKeyboard() and re-runs it whenever `active` flips either way.
  const releaseKeyboardRef = useRef(releaseKeyboard);
  releaseKeyboardRef.current = releaseKeyboard;
  useEffect(() => {
    releaseKeyboardRef.current();
  }, [active]);

  return (
    <div
      ref={setMessageInputEl}
      className={['message-input', disabled ? 'message-input-disabled' : '', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="message-input-tools">
        <TUIPopover
          open={emojiOpen}
          placement="top-start"
          disabled={disabled}
          offset={12}
          padded={false}
          reference={messageInputEl}
          onUpdateOpen={setEmojiOpenValue}
          contentSlot={(
            /* Portaled panels repeat room-chat-mobile on their own root. */
            <div className="room-chat-mobile message-input-emoji">
              {emojiChars.map(char => (
                <button
                  key={char}
                  type="button"
                  className="message-input-emoji-item"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    insertEmoji(char);
                  }}
                  onClickCapture={onEmojiClickCapture}
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
            onPointerDown={onEmojiPointerDown}
            onClickCapture={onEmojiClickCapture}
          >
            <IconSmileMobile size={16} />
          </button>
        </TUIPopover>
        <TUIPopover
          open={attachOpen}
          placement="top-start"
          disabled={disabled}
          offset={12}
          padded={false}
          onUpdateOpen={setAttachOpen}
          contentSlot={(
            /* Portaled panels repeat room-chat-mobile on their own root. */
            <div className="room-chat-mobile message-input-attach">
              <button type="button" className="message-input-attach-item" onClick={() => pickFile('image')}>
                <IconImageMobile size={16} />
                <span>{t('RoomChat.image')}</span>
              </button>
              <button type="button" className="message-input-attach-item" onClick={() => pickFile('video')}>
                <IconChatVideo size={16} />
                <span>{t('RoomChat.video')}</span>
              </button>
              <button type="button" className="message-input-attach-item" onClick={() => pickFile('file')}>
                <IconFileMobile size={16} />
                <span>{t('RoomChat.file')}</span>
              </button>
            </div>
          )}
        >
          <button
            type="button"
            className="message-input-tool"
            disabled={disabled}
            aria-label={t('RoomChat.attachment')}
          >
            <IconPaperclip size={16} />
          </button>
        </TUIPopover>
      </div>
      <div className="message-input-composer">
        <textarea
          ref={draftRef}
          value={draft}
          className="message-input-field"
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={!keyboardArmed}
          inputMode={keyboardArmed ? 'text' : 'none'}
          maxLength={maxLength}
          onPointerDown={onDraftPointerDown}
          onFocus={onDraftFocus}
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
