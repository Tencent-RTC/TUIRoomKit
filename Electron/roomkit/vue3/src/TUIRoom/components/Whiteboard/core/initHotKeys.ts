import { Canvas } from 'fabric/fabric-impl';
import hotkeys from 'hotkeys-js';
import FabricCanvas from './index';

const keyNames = {
  lrdu: 'left,right,down,up',
  backspace: 'backspace',
  delete: 'delete',
  ctrlz: 'ctrl+z',
  ctrly: 'ctrl+y',
  ctrlc: 'ctrl+c',
  ctrlv: 'ctrl+v',
};

function copyElement(canvas: Canvas) {
  let copyEl: object | null = null;

  hotkeys(keyNames.ctrlc, () => {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    activeObject.clone((_copyEl: object) => {
      canvas.discardActiveObject();
      _copyEl.set({
        left: (_copyEl.left as number) + 20,
        top: (_copyEl.top as number) + 20,
        evented: true,
      });
      copyEl = _copyEl;
    });
  });

  hotkeys(keyNames.ctrlv, () => {
    if (!copyEl) return;
    canvas.add(copyEl);
    canvas.setActiveObject(copyEl);
  });
}

function deleteObject(canvas : Canvas) {
  const activeObject = canvas.getActiveObjects();
  if (activeObject) {
    activeObject.forEach(item => canvas.remove(item));
    canvas.requestRenderAll();
    canvas.discardActiveObject();
  }
}

function initHotkeys(canvas: Canvas, fabricCanvas: FabricCanvas) {
  hotkeys(keyNames.backspace, () => {
    deleteObject(canvas);
  });

  hotkeys(keyNames.delete, () => {
    deleteObject(canvas);
  });

  hotkeys(keyNames.lrdu, (_event, handler) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      switch (handler.key) {
        case 'left':
          activeObject.set('left', (activeObject.left as number) - 1);
          break;
        case 'right':
          activeObject.set('left', (activeObject.left as number) + 1);
          break;
        case 'down':
          activeObject.set('top', (activeObject.top as number) + 1);
          break;
        case 'up':
          activeObject.set('top', (activeObject.top as number) - 1);
          break;
        default:
      }
      canvas.renderAll();
    }
  });

  copyElement(canvas);
}

export default initHotkeys;
export { keyNames, hotkeys };
