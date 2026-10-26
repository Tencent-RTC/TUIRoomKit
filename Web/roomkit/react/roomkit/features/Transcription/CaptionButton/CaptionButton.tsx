import { useEffect, useRef, useState } from 'react';
import { IconAISubtitles, TUIDropdown } from '../../../base';
import { useI18n } from '../../../i18n';
import { bindOverflowSubmenu } from '../../../layouts/OverflowToolbarPC/overflowSubmenu';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import CaptionConfirmDialog from './CaptionConfirmDialog';
import CaptionEntryMenu from './CaptionEntryMenu';
import { useCaptionEntryMenu } from './useCaptionEntryMenu';

export interface CaptionButtonProps {
  transcriptOpen: boolean;
  active?: boolean;
  onToggleTranscript?: () => void;
}

export function CaptionButton(props: CaptionButtonProps) {
  const { transcriptOpen, active, onToggleTranscript } = props;
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const menu = useCaptionEntryMenu(transcriptOpen, () => onToggleTranscript?.());
  const menuRef = useRef(menu);
  menuRef.current = menu;

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) {
      return undefined;
    }
    const keepCollapsedClosed = (event: MouseEvent) => {
      if (getComputedStyle(el).display === 'none') {
        event.stopPropagation();
      }
    };
    el.addEventListener('click', keepCollapsedClosed, true);
    const unbindSubmenu = bindOverflowSubmenu(el, () => {
      const { current } = menuRef;
      return {
        title: t('AITools.Entry'),
        hint: current.hint,
        items: current.items,
        run: current.run,
      };
    });
    return () => {
      el.removeEventListener('click', keepCollapsedClosed, true);
      unbindSubmenu();
    };
  }, [t]);

  return (
    <div ref={anchorRef}>
      <TUIDropdown
        open={menuOpen}
        trigger="click"
        placement="top"
        offset={12}
        onUpdateOpen={setMenuOpen}
        onCommand={command => menu.run(String(command))}
        menuSlot={(
          <CaptionEntryMenu transcriptOpen={transcriptOpen} />
        )}
      >
        <ToolbarButtonPC
          label={t('AITools.Entry')}
          icon={IconAISubtitles}
          active={active}
          hideMenu
        />
      </TUIDropdown>
      <CaptionConfirmDialog />
    </div>
  );
}

export default CaptionButton;
