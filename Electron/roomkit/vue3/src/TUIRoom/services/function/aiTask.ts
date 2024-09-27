import { IRoomService } from '../';
import mitt from 'mitt';
import { isElectron, isMobile } from '../../utils/environment';

interface SubtitleMessage {
  userid: string;
  text: string;
  translation_text: string;
}
interface DataPayload {
  end: boolean;
  text: string;
  translation_text: string;
  start_time: string;
  end_time: string;
}

interface MessageData {
  type: number | string;
  payload: DataPayload;
  sender: string;
  userid: string;
  text: string;
  translation_text: string;
  start_time: string;
  end_time: string;
  start_ms_ts: number;
  end_ms_ts: number;
}

export enum AI_TASK {
  TRANSCRIPTION_TASK = 'transcription',
}

export interface AITaskEvent {
  [AI_TASK.TRANSCRIPTION_TASK]: {
    subtitleMsg: SubtitleMessage[];
    subtitleText: { value: string };
    transcriptionText: { value: string };
  };
  [key: string]: unknown;
  [key: symbol]: unknown;
}

export class AITask {
  private emitter = mitt<AITaskEvent>();

  private trtc: any;
  private service: IRoomService;
  public subtitleMsg: SubtitleMessage[] = [];
  public subtitleText: { value: string } = { value: '' };
  public transcriptionText: { value: string } = { value: '' };

  constructor(service: IRoomService) {
    this.service = service;
    if (isElectron || isMobile) return;
    this.bindCtx();
    this.bindEvent();
  }

  private bindCtx() {
    this.handleMount = this.handleMount.bind(this);
    this.handleUnmount = this.handleUnmount.bind(this);
    this.handleAIMessage = this.handleAIMessage.bind(this);
  }

  public on<T extends keyof AITaskEvent>(
    eventType: T,
    callback: (data?: AITaskEvent[T]) => void
  ) {
    this.emitter.on(eventType, callback);
  }

  public off<T extends keyof AITaskEvent>(
    eventType: T,
    callback: (data?: AITaskEvent[T]) => void
  ) {
    this.emitter.off(eventType, callback);
  }

  public emit<T extends keyof AITaskEvent>(eventType: T, data: AITaskEvent[T]) {
    this.emitter.emit(eventType, data);
  }

  public dispose() {
    this.service.lifeCycleManager.off('mount', this.handleMount);
    this.service.lifeCycleManager.off('unmount', this.handleUnmount);
  }

  private handleMount() {
    // todo trtccloud adds custom-message event
    if (
      typeof this.service.roomEngine.instance?.getTRTCCloud === 'undefined' ||
      typeof this.service.roomEngine.instance?.getTRTCCloud()?._trtc ===
        'undefined'
    ) {
      return;
    }
    const trtc = this.service.roomEngine.instance?.getTRTCCloud()._trtc;
    this.trtc = trtc;
    trtc.on('custom-message', this.handleAIMessage);
  }
  private handleUnmount() {
    this.subtitleMsg = [];
    this.subtitleText.value = '';
    this.transcriptionText.value = '';
    this.trtc?.off('custom-message', this.handleAIMessage);
  }

  private bindEvent() {
    this.service.lifeCycleManager.on('mount', this.handleMount);
    this.service.lifeCycleManager.on('unmount', this.handleUnmount);
  }

  // todo trtc defines this type as any
  private handleAIMessage(event: any) {
    if (event.cmdId !== 1) return;
    const data = new TextDecoder().decode(event.data);
    const jsonData = JSON.parse(data);
    this.handleMessage(jsonData);
    this.emit(AI_TASK.TRANSCRIPTION_TASK, {
      subtitleText: this.subtitleText,
      transcriptionText: this.transcriptionText,
      subtitleMsg: this.subtitleMsg,
    });
  }

  private handleMessage(data: MessageData): void {
    const refreshSubtitle = (): void => {
      let displayText = '';
      for (let i = 0; i < this.subtitleMsg.length; i++) {
        displayText += `${this.service.roomStore.getDisplayName(this.subtitleMsg[i].userid)}: ${this.subtitleMsg[i].text}\n`;
        if (this.subtitleMsg[i].translation_text !== '') {
          displayText += `${this.service.roomStore.getDisplayName(this.subtitleMsg[i].userid)}: ${this.subtitleMsg[i].translation_text}\n`;
        }
      }
      this.subtitleText.value = displayText;
    };

    if (data.type === 10000 && data.payload.end === false) {
      // Real-time subtitles
      let exist = false;
      for (let i = 0; i < this.subtitleMsg.length; i++) {
        if (data.sender === this.subtitleMsg[i].userid) {
          this.subtitleMsg[i].text = data.payload.text;
          this.subtitleMsg[i].translation_text = data.payload.translation_text;
          exist = true;
          break;
        }
      }
      if (!exist) {
        this.subtitleMsg.push({
          userid: data.sender,
          text: data.payload.text,
          translation_text: data.payload.translation_text,
        });
      }

      refreshSubtitle();
    } else if (data.type === 10000 && data.payload.end === true) {
      // One sentence recognition completed
      let index = 0;
      for (let i = 0; i < this.subtitleMsg.length; i++) {
        if (data.sender === this.subtitleMsg[i].userid) {
          this.subtitleMsg[i].text = data.payload.text;
          this.subtitleMsg[i].translation_text = data.payload.translation_text;
          index = i;
          break;
        }
      }
      refreshSubtitle();
      // todo start_ms_ts end_ms_ts

      let content = `${data.payload.start_time}->${data.payload.end_time}  ${data.sender}: ${data.payload.text}\n`;
      if (data.payload.translation_text !== '') {
        content += `${data.payload.start_time}->${data.payload.end_time}  ${data.sender}: ${data.payload.translation_text}\n`;
      }
      this.transcriptionText.value += content;
    }

    // subtitle and transcription  is deprecated
    if (data.type === 'subtitle') {
      let exist = false;
      for (let i = 0; i < this.subtitleMsg.length; i++) {
        if (data.userid === this.subtitleMsg[i].userid) {
          this.subtitleMsg[i].text = data.text;
          this.subtitleMsg[i].translation_text = data.translation_text;
          exist = true;
          break;
        }
      }
      if (!exist) {
        this.subtitleMsg.push({
          userid: data.userid,
          text: data.text,
          translation_text: data.translation_text,
        });
      }

      refreshSubtitle();
    } else if (data.type === 'transcription') {
      let index = 0;
      for (let i = 0; i < this.subtitleMsg.length; i++) {
        if (data.userid === this.subtitleMsg[i].userid) {
          this.subtitleMsg[i].text = data.text;
          this.subtitleMsg[i].translation_text = data.translation_text;
          index = i;
          break;
        }
      }
      refreshSubtitle();

      let content = `${formatTimestampToTime(data.start_ms_ts)}->${formatTimestampToTime(data.end_ms_ts)}  ${this.service.roomStore.getDisplayName(data.userid)}: ${data.text}\n`;
      if (data.translation_text !== '') {
        content += `${formatTimestampToTime(data.start_ms_ts)}->${formatTimestampToTime(data.end_ms_ts)}  ${this.service.roomStore.getDisplayName(data.userid)}: ${data.translation_text}\n`;
      }
      this.transcriptionText.value += content;
    }
  }

  public StartAITranscription(): void {
    // Implementation for starting AI transcription
  }
}

// utils
function formatTimestampToTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
