import { createContext, useContext, useState } from 'react';

interface ChatComposerApi {
  register(fill: (text: string) => void): void;
  unregister(fill: (text: string) => void): void;
  fillDraft(text: string): void;
}

export const CHAT_COMPOSER_KEY = createContext<ChatComposerApi | null>(null);

/** Creates a stable composer api; render it through `<CHAT_COMPOSER_KEY.Provider value={api}>`. */
export function provideChatComposer(): ChatComposerApi {
  const [api] = useState<ChatComposerApi>(() => {
    let fillDraft: ((text: string) => void) | null = null;

    return {
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
  });

  return api;
}

export function useChatComposer() {
  return useContext(CHAT_COMPOSER_KEY);
}
