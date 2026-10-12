import { t } from '../i18n';

export interface CopyField {
  label: string;
  value?: string;
}

/**
 * Renders `label: value` lines for clipboard payloads. Fields without a value
 * are dropped so callers can pass optional entries unconditionally.
 */
export function formatCopyFields(fields: CopyField[]): string {
  const sep = t('LabelSep');
  return fields
    .filter(field => field.value?.trim())
    .map(field => `${field.label}${sep}${field.value!.trim()}`)
    .join('\n');
}
