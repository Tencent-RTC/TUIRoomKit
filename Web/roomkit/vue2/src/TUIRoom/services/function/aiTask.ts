import { IRoomService } from '../';
import mitt from 'mitt';
import { isElectron, isMobile } from '../../utils/environment';
import { findLastIndex } from '../../utils/utils';

export interface SubtitleMessage {
  sender: string;
  text: string;
  translationText: string;
  end?: boolean;
  startMsTs: number;
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
    subtitleMessages: { [key: string]: SubtitleMessage };
    transcribedMessageList: SubtitleMessage[];
  };
  [key: string]: unknown;
  [key: symbol]: unknown;
}

const ASR_EVENT_CODE = 10000;

export class AITask {
  private emitter = mitt<AITaskEvent>();
  private trtc: any;
  private service: IRoomService;
  public subtitleMessages: { [key: string]: SubtitleMessage } = {};
  public transcribedMessageList: SubtitleMessage[] = [];
  private subtitleTimeout: { [key: string]: ReturnType<typeof setTimeout> } =
    {};
  private transcriptionTimeout: {
    [key: string]: ReturnType<typeof setTimeout>;
  } = {};

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
    if (
      typeof this.service.roomEngine.instance?.getTRTCCloud === 'undefined' ||
      typeof this.service.roomEngine.instance?.getTRTCCloud()?._trtc ===
        'undefined'
    ) {
      return;
    }
    this.trtc = this.service.roomEngine.instance?.getTRTCCloud()._trtc;
    this.trtc.on('custom-message', this.handleAIMessage);
  }

  private handleUnmount() {
    this.subtitleMessages = {};
    this.transcribedMessageList = [];

    Object.values(this.subtitleTimeout).forEach(timeout =>
      clearTimeout(timeout)
    );
    Object.values(this.transcriptionTimeout).forEach(timeout =>
      clearTimeout(timeout)
    );
    this.subtitleTimeout = {};
    this.transcriptionTimeout = {};

    this.trtc?.off('custom-message', this.handleAIMessage);
  }

  private bindEvent() {
    this.service.lifeCycleManager.on('mount', this.handleMount);
    this.service.lifeCycleManager.on('unmount', this.handleUnmount);
  }

  private resetSubtitleTimeout(id: string, fn: () => void) {
    if (this.subtitleTimeout[id]) {
      clearTimeout(this.subtitleTimeout[id]);
    }
    this.subtitleTimeout[id] = setTimeout(fn, 3000);
  }

  private resetTranscriptionTimeout(id: string, timeInterval = 3000) {
    if (this.transcriptionTimeout[id]) {
      clearTimeout(this.transcriptionTimeout[id]);
    }
    this.transcriptionTimeout[id] = setTimeout(() => {
      const transcriptionIndex = findLastIndex(
        this.transcribedMessageList,
        msg => msg.sender === id && !msg.end
      );

      if (transcriptionIndex !== -1) {
        this.transcribedMessageList[transcriptionIndex].end = true;
        this.emit(AI_TASK.TRANSCRIPTION_TASK, {
          subtitleMessages: this.subtitleMessages,
          transcribedMessageList: this.transcribedMessageList,
        });
      }

      delete this.transcriptionTimeout[id];
    }, timeInterval);
  }

  private handleAIMessage(event: any) {
    if (event.cmdId !== 1) return;
    const data = new TextDecoder().decode(event.data);
    const jsonData = JSON.parse(data);
    this.handleMessage(jsonData);
    this.emit(AI_TASK.TRANSCRIPTION_TASK, {
      subtitleMessages: this.subtitleMessages,
      transcribedMessageList: this.transcribedMessageList,
    });
  }

  private handleMessage(data: MessageData): void {
    if (data.type !== ASR_EVENT_CODE) return;
    const { sender, payload } = data;
    const { end } = payload;

    const createSubtitleMsg = () => {
      return {
        sender,
        text: payload.text,
        translationText: payload.translation_text,
        startMsTs: data.start_ms_ts,
        end,
      };
    };

    const updateMsg = (msg: SubtitleMessage) => {
      msg.text = payload.text;
      msg.translationText = payload.translation_text;
      msg.end = end;
    };

    const appendMsg = <T extends SubtitleMessage>(
      msg: T,
      target: T[] | Record<string, T>
    ) => {
      if (Array.isArray(target)) {
        target.push(msg);
      } else if (typeof target === 'object') {
        const recordTarget = target as Record<string, T>;
        recordTarget[msg.sender] = msg;
      } else {
        throw new Error('Invalid target type');
      }
    };

    const existingSubtitle = this.subtitleMessages[sender];
    if (existingSubtitle) {
      updateMsg(existingSubtitle);
    } else {
      appendMsg(createSubtitleMsg(), this.subtitleMessages);
    }

    const transcriptionIndex = findLastIndex(
      this.transcribedMessageList,
      msg => msg.sender === sender && !msg.end
    );
    if (transcriptionIndex !== -1) {
      updateMsg(this.transcribedMessageList[transcriptionIndex]);
      if (!end) {
        this.resetTranscriptionTimeout(sender);
      } else {
        if (this.transcriptionTimeout[sender]) {
          clearTimeout(this.transcriptionTimeout[sender]);
          delete this.transcriptionTimeout[sender];
        }
      }
    } else {
      appendMsg(createSubtitleMsg(), this.transcribedMessageList);
      if (!end) {
        this.resetTranscriptionTimeout(sender);
      }
    }

    this.resetSubtitleTimeout(sender, () => {
      if (!end) return;
      delete this.subtitleMessages[sender];
      this.emit(AI_TASK.TRANSCRIPTION_TASK, {
        subtitleMessages: this.subtitleMessages,
        transcribedMessageList: this.transcribedMessageList,
      });
    });
  }
}
