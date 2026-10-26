import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useASRState } from '../useASRState';
import SubtitleSettings from './SubtitleSettings';
import TranscriptLog from './TranscriptLog';
import TranscriptToolbar from './TranscriptToolbar';
import { useTranscriptToolbar } from './useTranscriptToolbar';
import './TranscriptList.scss';

export function TranscriptList(props: { style?: CSSProperties }) {
  const { style } = props;
  const {
    targetLanguage,
    asrOn,
    captionDisplayMode,
  } = useASRState();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    keyword,
    setKeyword,
    isSearchOpen,
    listRef,
    toggleSearch: toggleSearchField,
    closeSearch,
    copyLog,
  } = useTranscriptToolbar();

  function closeSettings() {
    setIsSettingsOpen(false);
  }

  function toggleSearch() {
    toggleSearchField();
    closeSettings();
  }

  function toggleSettings() {
    const next = !isSettingsOpen;
    setIsSettingsOpen(next);
    if (next) {
      closeSearch();
    }
  }

  return (
    <div className="transcript-panel" style={style}>
      <TranscriptToolbar
        asrOn={asrOn}
        keyword={keyword}
        searchOpen={isSearchOpen}
        settingsPressed={isSettingsOpen}
        onKeywordChange={setKeyword}
        onToggleSearch={toggleSearch}
        onCloseSearch={closeSearch}
        onCopy={() => {
          void copyLog();
        }}
        onSettings={toggleSettings}
        onCloseSettings={closeSettings}
        settingsSlot={isSettingsOpen ? <SubtitleSettings host="panel" /> : null}
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

export default TranscriptList;
