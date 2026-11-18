import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

interface ChatComposerApi {
  register(fill: (text: string) => void): void;
  unregister(fill: (text: string) => void): void;
  fillDraft(text: string): void;
}

const CHAT_COMPOSER_KEY: InjectionKey<ChatComposerApi> = Symbol('room-chat-composer');

export function provideChatComposer(): ChatComposerApi {
  let fillDraft: ((text: string) => void) | null = null;

  const api: ChatComposerApi = {
    register(fill) {
      fillDraft = fill;
    },
    unregister(fill) {
      if (fillDraft === fill) {
        fillDraft = null;
      }
    },
    fillDraft(text) {
      fillDraft?.(text);
    },
  };

  provide(CHAT_COMPOSER_KEY, api);
  return api;
}

export function useChatComposer() {
  return inject(CHAT_COMPOSER_KEY, null);
}
