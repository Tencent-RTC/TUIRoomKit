import { Suspense, createElement, lazy } from 'react';
import type { SceneViewProps, SceneViews } from '../core/mount';
import { RoomScene } from '../core/types';
import { ConferenceView } from './conference';
// Import by file path: the `./education` barrel would pull the whole scene into the entry.
import { EducationLoadingView } from './education/EducationLoadingView';

const LazyEducationView = lazy(() => import('./education').then(module => ({ default: module.EducationView })));

/**
 * The view RoomKit mounts for each scene; the package entry hands it to core.
 * Scenes other than the conference load on demand, so a conference-only host never
 * downloads them. Keep them out of the root entry's static exports for the same reason.
 * Lazy views must render inside a `Suspense` boundary.
 * Scene wording lives in the scene's i18n namespace in `i18n/locales/<language>/<scene>.ts`.
 */
export const SCENE_VIEWS: SceneViews = {
  [RoomScene.Conference]: ConferenceView,
  // The inner boundary shows a loading card while the chunk downloads, so the host is never blank.
  [RoomScene.Education]: (props: SceneViewProps) => createElement(
    Suspense,
    { fallback: createElement(EducationLoadingView) },
    createElement(LazyEducationView, props),
  ),
};
