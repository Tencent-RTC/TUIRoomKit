import { inject } from 'vue';

const MessageListContextSymbol = Symbol('MessageListContext');

function useMessageListContext(componentName: string) {
  const context = inject(MessageListContextSymbol, null);
  if (context === null) {
    throw new Error(`<${componentName}> must be used within Parent MessageList.`);
  }
  return context;
}

export {
  MessageListContextSymbol,
  useMessageListContext,
};
