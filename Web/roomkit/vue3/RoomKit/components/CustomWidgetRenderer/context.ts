import type { InjectionKey } from 'vue';

export interface WidgetDeclarationOrderContext {
  getDeclarationOrder: (componentName?: string) => number | undefined;
}

export const widgetDeclarationOrderContextKey: InjectionKey<WidgetDeclarationOrderContext> = Symbol('WidgetDeclarationOrderContext');
