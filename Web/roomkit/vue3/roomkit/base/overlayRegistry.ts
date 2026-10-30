import { ref } from 'vue';
import type { Ref } from 'vue';
import type { OverlayContext } from './tokens';

const stack: OverlayContext[] = [];

/** Scene of the most recently mounted explicit-scene provider. Append hosts
 * (scene 'auto') mirror it so body-level notices like exit dialogs keep the
 * active scene's brand tokens instead of falling back to conference. */
const activeSceneRef: Ref<string> = ref('conference');

export const activeScene: Readonly<Ref<string>> = activeSceneRef;

export function setActiveScene(scene: string): void {
  activeSceneRef.value = scene;
}

export function setActiveOverlayContext(ctx: OverlayContext | null) {
  if (ctx && !stack.includes(ctx)) {
    stack.push(ctx);
  }
}

export function removeOverlayContext(ctx: OverlayContext) {
  const index = stack.lastIndexOf(ctx);
  if (index >= 0) stack.splice(index, 1);
}

export function getActiveOverlayContext(): OverlayContext | null {
  return stack[stack.length - 1] ?? null;
}
