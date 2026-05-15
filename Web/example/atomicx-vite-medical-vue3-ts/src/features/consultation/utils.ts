import { MessageType } from 'tuikit-atomicx-vue3';

export interface ConsultationMessageLike {
  ID?: string;
  flow?: string;
  time?: number;
  type?: MessageType;
  payload?: {
    text?: string;
  };
  getMessageContent?: () => {
    text?: string;
  };
}

export function normalizeConsultationTimestamp(timestamp?: number) {
  if (!timestamp) {
    return 0;
  }
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
}

export function formatConsultationClock(timestamp?: number, withSeconds = true) {
  const timeValue = normalizeConsultationTimestamp(timestamp);
  if (!timeValue) {
    return '';
  }
  const date = new Date(timeValue);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  if (!withSeconds) {
    return `${hours}:${minutes}`;
  }
  const seconds = `${date.getSeconds()}`.padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function getConsultationMessageText(message: ConsultationMessageLike) {
  if (message.type === MessageType.TEXT || !message.type) {
    if (typeof message.payload?.text === 'string') {
      return message.payload.text;
    }
    const content =
      typeof message.getMessageContent === 'function'
        ? message.getMessageContent()
        : undefined;
    if (typeof content?.text === 'string') {
      return content.text;
    }
  }
  if (message.type === MessageType.IMAGE) {
    return '[图片消息]';
  }
  if (message.type === MessageType.VIDEO) {
    return '[视频消息]';
  }
  if (message.type === MessageType.FILE) {
    return '[文件消息]';
  }
  return '[暂不支持的消息类型]';
}

export function formatElapsedDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}
