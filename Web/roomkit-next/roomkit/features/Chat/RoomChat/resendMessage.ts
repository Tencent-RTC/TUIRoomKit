import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';

type RawSdkMessage = {
  status?: string;
};

type ChatSdk = {
  resendMessage?: (message: RawSdkMessage) => Promise<unknown>;
};

export class ResendUnavailableError extends Error {
  constructor() {
    super('Cannot resend: missing raw message');
    this.name = 'ResendUnavailableError';
  }
}

function getRawMessage(message: MessageInfo): RawSdkMessage | undefined {
  return (message as MessageInfo & { _rawSDK?: RawSdkMessage })._rawSDK;
}

export async function resendMessageInPlace(chat: ChatSdk | null | undefined, message: MessageInfo) {
  const raw = getRawMessage(message);
  if (!raw || typeof chat?.resendMessage !== 'function') {
    throw new ResendUnavailableError();
  }
  raw.status = 'unSend';
  await chat.resendMessage(raw);
}
