import { useState } from 'react';
import { IconAISubtitles, TUIDropdown } from '../../../base';
import { useI18n } from '../../../i18n';
import type { OverflowBehavior } from '../../../layouts/OverflowToolbarPC/overflowItem';
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
  const menu = useCaptionEntryMenu(transcriptOpen, () => onToggleTranscript?.());

  /** Collapsed into the more menu, the same actions drill in place there. */
  const overflowBehavior: OverflowBehavior = {
    submenu: {
      title: t('AITools.Entry'),
      note: menu.note,
      items: menu.items,
      run: menu.run,
    },
  };

  return (
    <div>
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
          overflowBehavior={overflowBehavior}
        />
      </TUIDropdown>
      <CaptionConfirmDialog />
    </div>
  );
}

export default CaptionButton;
