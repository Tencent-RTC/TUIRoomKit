import { useState } from 'react';
import { useChatContext } from 'tuikit-atomicx-react/chat';
import { IconEduNoticeEdit, TUIDialog, TUIInput, useI18n } from '../../../base';
import { EDU_CLASS_EVENT_ID, latestProtocolEvent, sendNotice } from '../customMessage';
import './ChatNoticeCard.scss';

export default function ChatNoticeCard({ channel, canEdit = false }: { channel: string; canEdit?: boolean }) {
  const { t } = useI18n();
  const { messageList } = useChatContext(channel);
  const envelope = latestProtocolEvent(messageList ?? [], EDU_CLASS_EVENT_ID, ['notice-update']);
  const title = envelope ? String(envelope.data.title ?? '').replace(/[:：]$/, '') : t('Education.Notice.WelcomeTitle');
  let lines = t('Education.Notice.WelcomeLines').split('\n').filter(Boolean);
  if (envelope) lines = Array.isArray(envelope.data.lines) ? envelope.data.lines.map(String) : [];
  const [editorOpen, setEditorOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');

  function openEditor() {
    setDraftTitle(title.replace(/[:：]$/, '').slice(0, 20));
    setDraftContent(lines.join('\n').slice(0, 200));
    setEditorOpen(true);
  }

  function saveNotice() {
    if (!canEdit) return;
    void sendNotice(EDU_CLASS_EVENT_ID, channel, 'notice-update', {
      title: draftTitle.trim().slice(0, 20) || t('Education.Notice.DefaultTitle'),
      lines: draftContent.slice(0, 200).split(/\n+/).map(line => line.trim()).filter(Boolean),
    }).catch(error => console.error('[RoomKit.noticeCard] notice update send failed:', error));
    setEditorOpen(false);
  }

  return (
    <div className="chat-notice-card">
      {canEdit && <button type="button" className="chat-notice-edit" aria-label={t('Education.Notice.EditTooltip')} title={t('Education.Notice.EditTooltip')} onClick={openEditor}><IconEduNoticeEdit size={14} /></button>}
      <div className="chat-notice-top">
        <span className="chat-notice-badge">{t('Education.Notice.Badge')}</span>
        <strong className="chat-notice-title">{title}</strong>
      </div>
      {lines.length > 0 && <div className="chat-notice-list-scroll"><p className="chat-notice-list">{lines.join('\n')}</p></div>}
      <TUIDialog open={editorOpen} onUpdateOpen={setEditorOpen} title={t('Education.Notice.EditTitle')} width="340px" closeOnOverlay={false} confirmText={t('Education.Notice.Save')} cancelText={t('Room.Cancel')} onConfirm={saveNotice}>
        <p className="chat-notice-edit-hint">{t('Education.Notice.EditHint')}</p>
        <label className="chat-notice-edit-field">
          <span>{t('Education.Notice.TitleLabel')}</span>
          <TUIInput modelValue={draftTitle} maxlength={20} placeholder={t('Education.Notice.TitlePlaceholder')} onUpdateModelValue={value => setDraftTitle(String(value ?? ''))} />
        </label>
        <label className="chat-notice-edit-field chat-notice-edit-content">
          <span>{t('Education.Notice.ContentLabel')}</span>
          <TUIInput modelValue={draftContent} type="textarea" rows={3} maxlength={200} onUpdateModelValue={value => setDraftContent(String(value ?? ''))} />
        </label>
      </TUIDialog>
    </div>
  );
}
