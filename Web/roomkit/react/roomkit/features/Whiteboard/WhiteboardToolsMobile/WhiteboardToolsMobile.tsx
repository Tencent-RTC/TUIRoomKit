import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { IconChevronRightMobile, IconEraser, IconPen, IconRedo, IconUndo } from '../../../base';
import { useWhiteboardState } from '../WhiteboardState';
import './WhiteboardToolsMobile.scss';

type DrawingTool = 'pen' | 'eraser';

/** Pen panel: four widths, then the twelve classroom colors. White and medium start selected. */
const STROKE_WIDTHS = [
  { value: 1.6, dot: 4 },
  { value: 3, dot: 7 },
  { value: 5.5, dot: 11 },
  { value: 9, dot: 15 },
] as const;

const PEN_COLORS = [
  '#ffffff',
  '#bdbdbd',
  '#1a1a1a',
  '#e54545',
  '#ff7a00',
  '#f5c542',
  '#00c853',
  '#00c9a7',
  '#0a84ff',
  '#7c4dff',
  '#ff5aa5',
  '#8d6e63',
] as const;

export function WhiteboardToolsMobile() {
  const { isWhiteboardOn, isAnnotationOn, canUndo, canRedo, updatePlugin } = useWhiteboardState();

  const penBtnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const visible = isWhiteboardOn || isAnnotationOn;
  const [collapsed, setCollapsed] = useState(false);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [penPanelOpen, setPenPanelOpen] = useState(false);
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0]);
  const [penWidth, setPenWidth] = useState<number>(STROKE_WIDTHS[1].value);

  function run(options: Parameters<typeof updatePlugin>[0], action: string) {
    updatePlugin(options).catch((error: unknown) => {
      console.warn(`[WhiteboardToolsMobile] ${action} failed:`, error);
    });
  }

  function applyPen(color = penColor, lineWidth = penWidth) {
    run({ tool: { name: 'pen', color, lineWidth } }, 'set pen');
  }

  useEffect(() => {
    if (!visible) {
      return;
    }
    setTool('pen');
    setCollapsed(false);
    setPenPanelOpen(false);
    applyPen();
  }, [visible]);

  function selectPen() {
    if (tool !== 'pen') {
      setTool('pen');
      applyPen();
    }
  }

  /** Switches the tool and toggles the side panel in one tap, as the dock pen does. */
  function onPenClick() {
    selectPen();
    setPenPanelOpen(open => !open);
  }

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    if (next) {
      setPenPanelOpen(false);
    }
  }

  function selectWidth(width: number) {
    setPenWidth(width);
    applyPen(penColor, width);
  }

  function selectColor(color: string) {
    setPenColor(color);
    applyPen(color, penWidth);
  }

  useEffect(() => {
    if (!penPanelOpen) {
      return undefined;
    }
    function onDocPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      /* Selecting inside the panel keeps it open; the pen button toggles in its own
         click handler, so both stay exempt here. */
      if (panelRef.current?.contains(target) || penBtnRef.current?.contains(target)) {
        return;
      }
      setPenPanelOpen(false);
    }
    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown, true);
    };
  }, [penPanelOpen]);

  /** The document pointerdown close runs before this click, so the panel is already shut. */
  function selectEraser() {
    setTool('eraser');
    run({ tool: { name: 'eraserObject' } }, 'set tool');
  }

  function undo() {
    if (!canUndo) return;
    run({ operation: 'undo' }, 'undo');
  }

  function redo() {
    if (!canRedo) return;
    run({ operation: 'redo' }, 'redo');
  }

  if (!visible) {
    return null;
  }
  return (
    <div className={['whiteboard-tools', collapsed ? 'is-collapsed' : ''].filter(Boolean).join(' ')}>
      <div className="whiteboard-tools-dock">
        <button className="whiteboard-tools-fold" type="button" onClick={toggleCollapsed}>
          <IconChevronRightMobile size={12} />
        </button>
        <button
          ref={penBtnRef}
          className={['whiteboard-tools-btn', tool === 'pen' ? 'is-on' : ''].filter(Boolean).join(' ')}
          type="button"
          onClick={onPenClick}
        >
          <IconPen size={16} />
          <i className="whiteboard-tools-tint" style={{ background: penColor }} />
        </button>
        {penPanelOpen && (
          <div ref={panelRef} className="whiteboard-tools-pen-panel">
            <div className="whiteboard-tools-sizes" style={{ '--pen-color': penColor } as CSSProperties}>
              {STROKE_WIDTHS.map(size => (
                <button
                  key={size.value}
                  className={['whiteboard-tools-size', penWidth === size.value ? 'is-on' : ''].filter(Boolean).join(' ')}
                  type="button"
                  style={{ '--dot': `${size.dot}px` } as CSSProperties}
                  onClick={() => selectWidth(size.value)}
                />
              ))}
            </div>
            <span className="whiteboard-tools-pen-rule" />
            <div className="whiteboard-tools-colors">
              {PEN_COLORS.map(swatch => (
                <button
                  key={swatch}
                  className={['whiteboard-tools-swatch', penColor === swatch ? 'is-on' : ''].filter(Boolean).join(' ')}
                  type="button"
                  style={{ '--swatch': swatch } as CSSProperties}
                  onClick={() => selectColor(swatch)}
                />
              ))}
            </div>
          </div>
        )}
        <button
          className={['whiteboard-tools-btn', tool === 'eraser' ? 'is-on' : ''].filter(Boolean).join(' ')}
          type="button"
          onClick={selectEraser}
        >
          <IconEraser size={16} />
        </button>
        <span className="whiteboard-tools-rule" />
        <button className="whiteboard-tools-btn" type="button" disabled={!canUndo} onClick={undo}>
          <IconUndo size={16} />
        </button>
        <button className="whiteboard-tools-btn" type="button" disabled={!canRedo} onClick={redo}>
          <IconRedo size={16} />
        </button>
      </div>
    </div>
  );
}

export default WhiteboardToolsMobile;
