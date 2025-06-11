import { defineComponent, PropType } from 'vue';

export type ActionType<T> = {
  key: T;
  icon?: PropType<ReturnType<typeof defineComponent>>;
  label: string;
  handler: (data?: any) => void;
  style?: string;
};
