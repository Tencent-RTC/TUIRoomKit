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

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Mobile webviews and teleported popovers that lost document focus
      // reject the async API even inside a user gesture.
    }
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(input);
  if (!ok) {
    throw new Error('copy failed');
  }
}
