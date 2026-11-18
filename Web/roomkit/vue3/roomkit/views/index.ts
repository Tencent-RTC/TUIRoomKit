import { defineAsyncComponent } from 'vue';
import type { SceneViews } from '../core/mount';
import { RoomScene } from '../core/types';
import { ConferenceView } from './conference';
// Import by file path: the `./education` barrel would pull the whole scene into the entry.
import EducationLoadingView from './education/EducationLoadingView.vue';

/**
 * The view RoomKit mounts for each scene; the package entry hands it to core.
 * Scenes other than the conference load on demand, so a conference-only host never
 * downloads them. Keep them out of the root entry's static exports for the same reason.
 * Scene wording lives in the scene's i18n namespace in `i18n/locales/<language>/<scene>.ts`.
 */
export const SCENE_VIEWS: SceneViews = {
  [RoomScene.Conference]: ConferenceView,
  [RoomScene.Education]: defineAsyncComponent({
    loader: () => import('./education').then(module => module.EducationView),
    loadingComponent: EducationLoadingView,
    // The default 200ms delay would leave the host blank while the chunk downloads.
    delay: 0,
  }),
};
