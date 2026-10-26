import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import type { MessageInfo } from 'tuikit-atomicx-react/chat';
import {
  TUIAvatar,
  TUIDropdown,
  TUIDropdownItem,
  IconCopy,
  IconDelete,
  IconDownload,
  IconFail,
  IconFile,
  IconFileMobile,
  IconLoading,
  IconRecall,
} from '../../../base';
import { t, useI18n } from '../../../base/i18n';
import MediaPreview from './MediaPreview';
import { useChatMessage } from './useChatMessage';
import type { MessageAction } from './useMessageActions';
import './ChatMessage.scss';

export interface ChatMessageProps {
  message: MessageInfo;
  actions?: readonly MessageAction[];
  compact?: boolean;
  mobile?: boolean;
  className?: string;
  style?: CSSProperties;
}

const EMPTY_ACTIONS: MessageAction[] = [];

export function ChatMessage(props: ChatMessageProps) {
  const {
    message,
    actions = EMPTY_ACTIONS,
    compact = false,
    mobile = false,
    className,
    style,
  } = props;

  useI18n();
  const {
    isRecalled,
    canReedit,
    recalledText,
    senderAvatar,
    senderName,
    timeText,
    isFailed,
    isSending,
    menuOpen,
    setMenuOpen,
    visibleActions,
    bubbleKind,
    textParts,
    fileName,
    fileSizeText,
    imageThumb,
    imageOpenUrl,
    videoOpenUrl,
    videoPoster,
    videoDurationText,
    fallbackText,
    reeditRecalled,
    retrySend,
    onActionCommand,
    downloadFile,
  } = useChatMessage({ message, actions, compact });

  const menuIconSize = mobile ? 14 : 16;

  // Vue renders these as v-if / v-else-if branches on the bubble.
  function renderBubble() {
    if (bubbleKind === 'text') {
      return (
        <span className="chat-message-text">
          {textParts.map((part, index) => (
            <Fragment key={index}>
              {part.src
                ? (
                  <img
                    className="chat-message-emoji"
                    src={part.src}
                    alt=""
                  />
                )
                : (
                  <span>{part.text}</span>
                )}
            </Fragment>
          ))}
        </span>
      );
    }
    if (bubbleKind === 'file') {
      return (
        <div className="chat-file" onClick={event => event.stopPropagation()}>
          <span className="chat-file-icon">
            {mobile
              ? <IconFileMobile size={16} />
              : <IconFile size={20} />}
          </span>
          <span className="chat-file-meta">
            <span className="chat-file-name">{fileName}</span>
            {fileSizeText && <span className="chat-file-size">{fileSizeText}</span>}
          </span>
          <button
            type="button"
            className="chat-file-download"
            aria-label={t('RoomChat.download')}
            onClick={(event) => {
              event.stopPropagation();
              downloadFile();
            }}
          >
            <IconDownload size={14} />
          </button>
        </div>
      );
    }
    if (bubbleKind === 'image') {
      return (
        <MediaPreview src={imageOpenUrl} poster={imageThumb} mobile={mobile} />
      );
    }
    if (bubbleKind === 'video') {
      return (
        <MediaPreview
          kind="video"
          src={videoOpenUrl}
          poster={videoPoster}
          duration={videoDurationText}
          mobile={mobile}
        />
      );
    }
    return <span className="chat-message-text">{fallbackText}</span>;
  }

  return (
    <div
      className={[
        'chat-message',
        mobile ? 'chat-message-mobile' : '',
        isRecalled ? 'chat-message-recalled' : '',
        !isRecalled && message.isSentBySelf ? 'chat-message-self' : '',
        !isRecalled && compact ? 'chat-message-compact' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {isRecalled
        ? (
          <>
            <span>{recalledText}</span>
            {canReedit && (
              <button
                type="button"
                className="chat-message-reedit"
                onClick={reeditRecalled}
              >
                {t('RoomChat.reedit')}
              </button>
            )}
          </>
        )
        : (
          <>
            {!compact
              ? (
                <TUIAvatar
                  className="chat-message-avatar"
                  src={senderAvatar}
                  alt={senderName}
                  size={mobile ? 28 : 32}
                />
              )
              : (
                <span
                  className="chat-message-avatar-spacer"
                  aria-hidden="true"
                />
              )}
            <div className="chat-message-body">
              {!compact && (
                <div className="chat-message-meta">
                  <span className="chat-message-name">{senderName}</span>
                  {timeText && <span className="chat-message-time">{timeText}</span>}
                </div>
              )}
              <div className="chat-message-row">
                {message.isSentBySelf && (
                  <span className="chat-message-aside">
                    {isFailed && (
                      <button
                        type="button"
                        className="chat-message-fail"
                        aria-label={t('RoomChat.retry')}
                        onClick={(event) => {
                          event.stopPropagation();
                          retrySend();
                        }}
                      >
                        <IconFail size={16} />
                      </button>
                    )}
                    {!isFailed && isSending && (
                      <span className="chat-message-status">
                        <IconLoading size={14} spin />
                      </span>
                    )}
                  </span>
                )}
                <div className="chat-message-hit">
                  <TUIDropdown
                    open={menuOpen}
                    disabled={visibleActions.length === 0}
                    placement={message.isSentBySelf ? 'bottom-end' : 'bottom-start'}
                    offset={2}
                    contextmenu
                    onCommand={onActionCommand}
                    onUpdateOpen={setMenuOpen}
                    menuSlot={(
                      <div className={['chat-message-menu', mobile ? 'chat-message-menu-mobile' : ''].filter(Boolean).join(' ')}>
                        {visibleActions.map(action => (
                          <TUIDropdownItem
                            key={action.key}
                            command={action.key}
                            danger={action.danger}
                          >
                            {action.key === 'copy' && <IconCopy size={menuIconSize} />}
                            {action.key === 'recall' && <IconRecall size={menuIconSize} />}
                            {action.key === 'delete' && <IconDelete size={menuIconSize} />}
                            <span>{action.label}</span>
                          </TUIDropdownItem>
                        ))}
                      </div>
                    )}
                  >
                    <div className={`chat-message-bubble chat-message-bubble-${bubbleKind}`}>
                      {renderBubble()}
                    </div>
                  </TUIDropdown>
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
}

export default ChatMessage;
