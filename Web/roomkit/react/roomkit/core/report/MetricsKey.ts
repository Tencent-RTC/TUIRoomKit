import { RoomScene } from '../types';

export enum MetricsKey {
  T_METRICS_SCENE_CONFERENCE_INIT = 192590,
  T_METRICS_SCENE_EDUCATION_INIT = 192591,
}

export const SCENE_METRICS_KEYS: Record<RoomScene, MetricsKey> = {
  [RoomScene.Conference]: MetricsKey.T_METRICS_SCENE_CONFERENCE_INIT,
  [RoomScene.Education]: MetricsKey.T_METRICS_SCENE_EDUCATION_INIT,
};
