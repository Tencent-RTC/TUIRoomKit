import type { OverlayContext } from './tokens';

const stack: OverlayContext[] = [];

type SceneListener = (scene: string) => void;

/** Scene of the most recently mounted explicit-scene provider. Append hosts
 * (scene 'auto') mirror it so body-level notices like exit dialogs keep the
 * active scene's brand tokens instead of falling back to conference. */
let activeSceneValue = 'conference';
const sceneListeners = new Set<SceneListener>();

export function getActiveScene(): string {
  return activeSceneValue;
}

export function setActiveScene(scene: string): void {
  if (activeSceneValue === scene) {
    return;
  }
  activeSceneValue = scene;
  sceneListeners.forEach(listener => listener(scene));
}

export function subscribeActiveScene(listener: SceneListener): () => void {
  sceneListeners.add(listener);
  return () => {
    sceneListeners.delete(listener);
  };
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
