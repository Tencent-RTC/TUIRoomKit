export interface BeautyLevels {
  beautyLevel: number;
  whitenessLevel: number;
  ruddinessLevel: number;
}

export const ZERO_BEAUTY: BeautyLevels = {
  beautyLevel: 0,
  whitenessLevel: 0,
  ruddinessLevel: 0,
};

export function isBeautyEnabled(levels: BeautyLevels): boolean {
  return levels.beautyLevel > 0 || levels.whitenessLevel > 0 || levels.ruddinessLevel > 0;
}

export function clampBeautyLevel(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function normalizeBeautyLevels(levels: Partial<BeautyLevels> | undefined): BeautyLevels {
  return {
    beautyLevel: clampBeautyLevel(levels?.beautyLevel ?? 0),
    whitenessLevel: clampBeautyLevel(levels?.whitenessLevel ?? 0),
    ruddinessLevel: clampBeautyLevel(levels?.ruddinessLevel ?? 0),
  };
}
