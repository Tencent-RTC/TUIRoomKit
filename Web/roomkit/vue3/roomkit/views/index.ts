import { defineAsyncComponent } from 'vue';
import type { Component } from 'vue';
import { RoomScene } from '../core/types';
import { ConferenceView } from './conference';

/** Session-exit notices core raises on a scene's behalf. */
export type SceneNotice =
  | 'RoomEnded'
  | 'KickedByAdmin'
  | 'KickedByServer'
  | 'ReplacedByAnotherDevice'
  | 'ConnectionTimeout'
  | 'InvalidStatusOnReconnect'
  | 'RoomLimitExceeded'
  | 'DefaultKickedOut';

export interface SceneDefinition {
  view: Component;
  /** i18n keys replacing the default notice wording; unlisted notices keep the default. */
  notices?: Partial<Record<SceneNotice, string>>;
}

/**
 * Scenes other than the conference load on demand, so a conference-only host never
 * downloads them. Keep them out of the root entry's static exports for the same reason.
 * Everything but `view` stays inline here: a static import of a scene folder would pull it into the main chunk.
 */
export const SCENES: Record<RoomScene, SceneDefinition> = {
  [RoomScene.Conference]: {
    view: ConferenceView,
  },
  [RoomScene.Education]: {
    view: defineAsyncComponent(() => import('./education').then(module => module.EducationView)),
    notices: {
      RoomEnded: 'Education.Notify.RoomEnded',
      KickedByAdmin: 'Education.Notify.KickedByAdmin',
      KickedByServer: 'Education.Notify.KickedByServer',
      ConnectionTimeout: 'Education.Notify.ConnectionTimeout',
      InvalidStatusOnReconnect: 'Education.Notify.InvalidStatusOnReconnect',
      RoomLimitExceeded: 'Education.Notify.RoomLimitExceeded',
      DefaultKickedOut: 'Education.Notify.DefaultKickedOut',
    },
  },
};
