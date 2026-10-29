import { lazy } from 'react';
import type { ComponentType } from 'react';
import { RoomScene } from '../core/types';
import { ConferenceView } from './conference';

export interface SceneViewProps {
  roomName?: string;
  onLeave?: () => void;
}

/**
 * Scenes other than the conference load on demand, so a conference-only host never
 * downloads them. Keep them out of the root entry's static exports for the same reason.
 * Lazy views must render inside a `Suspense` boundary.
 */
export const SCENE_VIEWS: Record<RoomScene, ComponentType<SceneViewProps>> = {
  [RoomScene.Conference]: ConferenceView,
  [RoomScene.Education]: lazy(() => import('./education').then(module => ({ default: module.EducationView }))),
};
