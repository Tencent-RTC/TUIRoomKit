import { useRef, useState } from 'react';
import { TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import { copyTextToClipboard } from '../../../utils/clipboard';
import type { TranscriptLogHandle } from './TranscriptLog';

/**
 * Search field and copy action shared by the PC transcript panel and the H5 sheet.
 * Settings stay with each surface: an in-panel popover on PC, a separate sheet on H5.
 */
export function useTranscriptToolbar() {
  const { t } = useI18n();
  const [keyword, setKeyword] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isSearchOpenRef = useRef(false);
  const listRef = useRef<TranscriptLogHandle | null>(null);

  function toggleSearch() {
    const next = !isSearchOpenRef.current;
    isSearchOpenRef.current = next;
    setIsSearchOpen(next);
    if (!next) {
      setKeyword('');
    }
  }

  function closeSearch() {
    isSearchOpenRef.current = false;
    setIsSearchOpen(false);
    setKeyword('');
  }

  async function copyLog() {
    const text = listRef.current?.copyText() ?? '';
    const count = listRef.current?.entryCount() ?? 0;
    try {
      await copyTextToClipboard(text);
      const key = keyword.trim() ? 'AITools.CopiedSearch' : 'AITools.CopiedTranscript';
      TUIToast.success({ message: t(key, { count }) });
    } catch {
      TUIToast.error({ message: t('RoomInfo.CopyFailed') });
    }
  }

  return {
    keyword,
    setKeyword,
    isSearchOpen,
    listRef,
    toggleSearch,
    closeSearch,
    copyLog,
  };
}
