import type { BusinessPanelMode, LaunchMode } from '@/services/adapters/types';

export const MEDICAL_MODE = (import.meta.env.VITE_MEDICAL_MODE ||
  'mock') as LaunchMode;

export const MEDICAL_BUSINESS_PANEL_MODE = (import.meta.env
  .VITE_MEDICAL_BUSINESS_PANEL_MODE || 'demo') as BusinessPanelMode;

export const MEDICAL_BUSINESS_SLOT_TITLE =
  import.meta.env.VITE_MEDICAL_BUSINESS_SLOT_TITLE ||
  'EMR / HIS / PACS 业务插槽';
