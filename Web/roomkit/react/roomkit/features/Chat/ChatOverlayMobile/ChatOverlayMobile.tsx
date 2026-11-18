import { useEffect, useRef, useState } from 'react';
import type { ElementRef, FormEvent, MouseEvent } from 'react';
import type { MessageInfo } from 'tuikit-atomicx-react/chat';
import { MessageStatus, MessageType, useChatContext } from 'tuikit-atomicx-react/chat';
import { RoomParticipantRole, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import { IconAISpark, IconChat, IconCollapse, IconSend, TUIList, TUIToast } from '../../../base';
import { t, useI18n } from '../../../base/i18n';
import { EDU_TROPHY_EVENT_ID, isProtocolMessage, findNoticeCopy, shouldHideMemberNotice, useSilenceAll } from '../customMessage';
import ChatContextSync from '../ChatButton/ChatContextSync';
import { getSendErrorMessage } from '../RoomChatPC/getSendErrorMessage';
import { useSenderProfile } from '../RoomChatPC/useSenderName';
import './ChatOverlayMobile.scss';

export interface ChatOverlayMobileProps {
  channel: string;
  /** Landscape barrage can fold into a chat button. Matches rk-edu-chat-overlay[collapsible]. */
  collapsible?: boolean;
  /** i18n key of the composer placeholder; the scene picks it by class mode. */
  placeholderKey?: string;
}

interface BarrageLine {
  id: string;
  system: boolean;
  name: string;
  teacher: boolean;
  text: string;
}

function noticeText(message: MessageInfo): string {
  const notice = findNoticeCopy(message);
  return notice ? t(notice.key, notice.params) : '';
}

export function ChatOverlayMobile(props: ChatOverlayMobileProps) {
  const { channel, collapsible = false, placeholderKey = 'Education.Chat.Placeholder' } = props;

  useI18n();
  const { messageList, sendMessage } = useChatContext(channel);
  const { currentRoom } = useRoomState();
  const { localParticipant } = useRoomParticipantState();
  const resolveProfile = useSenderProfile();
  const [draft, setDraft] = useState('');
  const listRef = useRef<ElementRef<typeof TUIList> | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const fieldRef = useRef<HTMLInputElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newLineCount, setNewLineCount] = useState(0);
  const [scrollRequest, setScrollRequest] = useState(0);

  const isHostOrAdmin = localParticipant?.role === RoomParticipantRole.Owner
    || localParticipant?.role === RoomParticipantRole.Admin;
  const { silenceAll } = useSilenceAll();
  // Either source closes the composer. The classroom switch only publishes the
  // timeline event: the engine flag would silence the sender's account too
  // (same rule as the room chat panel).
  const isAllSilenced = !isHostOrAdmin && (silenceAll || Boolean(currentRoom?.isAllMessageDisabled));
  const inputDisabled = Boolean(localParticipant?.isMessageDisabled) || isAllSilenced;
  let placeholder = t(placeholderKey);
  if (isAllSilenced) {
    placeholder = t('Education.Sync.ChatDisabled');
  } else if (inputDisabled) {
    placeholder = t('RoomChat.disabled_placeholder');
  }
  const foldMode = collapsible && (inputDisabled || draft.trim().length === 0);

  const ownerId = currentRoom?.roomOwner?.userId ?? '';
  const lines: BarrageLine[] = (messageList ?? []).flatMap((message): BarrageLine[] => {
    if (shouldHideMemberNotice(message) || message.status === MessageStatus.Deleted) return [];
    if (message.messageType === MessageType.Tips) {
      return [];
    }
    if (isProtocolMessage(message, EDU_TROPHY_EVENT_ID)) {
      return [];
    }
    if (message.status === MessageStatus.Recalled) {
      const { name } = resolveProfile(message);
      return [{
        id: message.id,
        system: true,
        name: '',
        teacher: false,
        text: message.isSentBySelf ? t('RoomChat.you_recalled') : t('RoomChat.recalled', { name }),
      }];
    }
    const notice = noticeText(message);
    if (notice) {
      return [{ id: message.id, system: true, name: '', teacher: false, text: notice }];
    }
    if (message.messageType !== MessageType.Text) {
      return [];
    }
    const text = (message.messagePayload as { text?: string })?.text || '';
    if (!text) {
      return [];
    }
    const profile = resolveProfile(message);
    return [{
      id: message.id,
      system: false,
      name: profile.name,
      teacher: Boolean(ownerId) && message.from?.userID === ownerId,
      text,
    }];
  });

  let unreadLabel = '';
  if (collapsed && unreadCount > 0) {
    unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount);
  }

  /* Lines that land while the reader is scrolled away; the jump pill reads it. */
  const newLineLabel = t('RoomChat.new_messages', { count: newLineCount > 99 ? '99+' : newLineCount });

  // Scroll after the expanded list has committed, like Vue nextTick.
  useEffect(() => {
    if (scrollRequest) {
      listRef.current?.scrollToBottom();
    }
  }, [scrollRequest]);

  function jumpToNewLines() {
    // Reaching the bottom clears the tally; the pin lands the reader on them.
    setStickToBottom(true);
    listRef.current?.scrollToBottom();
  }

  function collapse() {
    if (!collapsible || collapsed) {
      return;
    }
    fieldRef.current?.blur();
    setCollapsed(true);
  }

  function expand() {
    if (!collapsed) {
      return;
    }
    setCollapsed(false);
    setStickToBottom(true);
    setScrollRequest(value => value + 1);
  }

  function onActionClick(event: MouseEvent<HTMLButtonElement>) {
    if (!foldMode) {
      return;
    }
    event.preventDefault();
    collapse();
  }

  async function sendText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (inputDisabled || !text) {
      return;
    }
    setDraft('');
    setStickToBottom(true);
    try {
      await sendMessage({ type: 'textMessage', text });
    } catch (error) {
      setDraft(text);
      TUIToast.error(getSendErrorMessage(error));
    }
  }

  return (
    <div
      className={[
        'chat-overlay',
        inputDisabled ? 'is-muted' : '',
        collapsible ? 'is-collapsible' : '',
        foldMode ? 'is-fold-mode' : '',
        collapsed ? 'is-collapsed' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="chat-overlay-lines-wrap">
        <TUIList
          ref={listRef}
          className={['chat-overlay-lines', lines.length ? '' : 'is-empty'].filter(Boolean).join(' ')}
          variant="plain"
          itemSize="auto"
          scrollbar={false}
          stickToBottom={stickToBottom}
          onStickToBottomChange={setStickToBottom}
        >
          {lines.map(line => (
            <div
              key={line.id}
              className={['chat-overlay-item', line.system ? 'is-system' : ''].filter(Boolean).join(' ')}
            >
              {line.system
                ? line.text
                : (
                  <>
                    <span className="chat-overlay-who">
                      <b className="chat-overlay-name">{line.name}</b>
                      {line.teacher && <em className="chat-overlay-tag">{t('Education.Teacher')}</em>}
                    </span>
                    <span className="chat-overlay-colon">{t('Education.Barrage.Colon')}</span>
                    <span className="chat-overlay-text">{line.text}</span>
                  </>
                )}
            </div>
          ))}
        </TUIList>
        {/* Landscape barrage unread reminder (views-edu rk-edu-chat-overlay__jump):
            floats at the lines' bottom-left while the reader is scrolled away. */}
        {!collapsed && newLineCount > 0 && (
          <button
            type="button"
            className="chat-overlay-jump"
            aria-label={t('RoomChat.jump_to_latest')}
            onClick={jumpToNewLines}
          >
            <span>{newLineLabel}</span>
            <IconCollapse size={11} />
          </button>
        )}
      </div>
      <p className="chat-overlay-hint" hidden={lines.length > 0}>
        <IconAISpark size={14} />
        <span>{t('Education.Barrage.EmptyHint')}</span>
      </p>
      <form className="chat-overlay-composer" onSubmit={event => void sendText(event)}>
        <input
          ref={fieldRef}
          value={draft}
          className="chat-overlay-field"
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          disabled={inputDisabled}
          maxLength={1000}
          onChange={event => setDraft(event.target.value)}
        />
        <button
          className="chat-overlay-send"
          type={foldMode ? 'button' : 'submit'}
          disabled={inputDisabled && !foldMode}
          aria-label={foldMode ? t('Education.Chat.Collapse') : t('RoomChat.send')}
          onClick={onActionClick}
        >
          <IconSend className="is-send" size={13} />
          <IconCollapse className="is-fold" size={13} />
        </button>
      </form>
      <button
        type="button"
        className="chat-overlay-fab"
        aria-label={t('Education.Chat.Expand')}
        onClick={expand}
      >
        <IconChat size={16} />
        {unreadLabel && <em className="chat-overlay-badge">{unreadLabel}</em>}
      </button>
      {collapsible && (
        <ChatContextSync
          channel={channel}
          isActive={!collapsed}
          onUnreadChange={setUnreadCount}
        />
      )}
      {/* The pill tally rides the same counter the FAB badge uses, with
          "watching" meaning the lines are pinned to the bottom: rows that land
          while the reader is scrolled away count, reaching the bottom clears. */}
      <ChatContextSync
        channel={channel}
        isActive={stickToBottom}
        onUnreadChange={setNewLineCount}
      />
    </div>
  );
}

export default ChatOverlayMobile;
