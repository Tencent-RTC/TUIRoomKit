import { ref } from 'vue';
import { TUIToast, t } from '../../../base';
import { copyTextToClipboard } from '../../../utils/clipboard';

type TranscriptLogHandle = {
  copyText: () => string;
  entryCount: () => number;
};

/**
 * Search field and copy action shared by the PC transcript panel and the H5 sheet.
 * Settings stay with each surface: an in-panel popover on PC, a separate sheet on H5.
 */
export function useTranscriptToolbar() {
  const keyword = ref('');
  const isSearchOpen = ref(false);
  const listRef = ref<TranscriptLogHandle | null>(null);

  function toggleSearch() {
    isSearchOpen.value = !isSearchOpen.value;
    if (!isSearchOpen.value) {
      keyword.value = '';
    }
  }

  function closeSearch() {
    isSearchOpen.value = false;
    keyword.value = '';
  }

  async function copyLog() {
    const text = listRef.value?.copyText() ?? '';
    const count = listRef.value?.entryCount() ?? 0;
    try {
      await copyTextToClipboard(text);
      const key = keyword.value.trim() ? 'AITools.CopiedSearch' : 'AITools.CopiedTranscript';
      TUIToast.success({ message: t(key, { count }) });
    } catch {
      TUIToast.error({ message: t('RoomInfo.CopyFailed') });
    }
  }

  return {
    keyword,
    isSearchOpen,
    listRef,
    toggleSearch,
    closeSearch,
    copyLog,
  };
}
