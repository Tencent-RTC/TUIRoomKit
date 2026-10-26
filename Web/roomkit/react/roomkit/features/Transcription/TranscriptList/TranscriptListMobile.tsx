import { useASRState } from '../useASRState';
import TranscriptLog from './TranscriptLog';
import TranscriptToolbar from './TranscriptToolbar';
import { useTranscriptToolbar } from './useTranscriptToolbar';
import './TranscriptListMobile.scss';

export interface TranscriptListMobileProps {
  className?: string;
  onOpenSettings?: () => void;
}

export function TranscriptListMobile(props: TranscriptListMobileProps) {
  const { className, onOpenSettings } = props;
  const { targetLanguage, asrOn, captionDisplayMode } = useASRState();
  const {
    keyword,
    setKeyword,
    isSearchOpen,
    listRef,
    toggleSearch,
    closeSearch,
    copyLog,
  } = useTranscriptToolbar();

  return (
    <div className={['transcript-mobile', className].filter(Boolean).join(' ')}>
      <TranscriptToolbar
        mobile
        asrOn={asrOn}
        keyword={keyword}
        searchOpen={isSearchOpen}
        onKeywordChange={setKeyword}
        onToggleSearch={toggleSearch}
        onCloseSearch={closeSearch}
        onCopy={() => {
          void copyLog();
        }}
        onSettings={() => onOpenSettings?.()}
        onCloseSettings={() => {}}
      />
      <TranscriptLog
        ref={listRef}
        targetLanguage={targetLanguage}
        captionMode={captionDisplayMode}
        keyword={keyword}
      />
    </div>
  );
}

export default TranscriptListMobile;
