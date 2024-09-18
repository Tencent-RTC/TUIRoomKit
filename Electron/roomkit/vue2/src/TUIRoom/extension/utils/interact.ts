import { EventType, roomService } from '../../services';
import interact from 'interactjs';

export const setDragAndResize = (domSelect: string) => {
  const minWidth = 830;
  const minHeight = 630;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  interact(domSelect)
    .draggable({
      onstart: (event: any) => {
        const { target } = event;
        target.style.margin = 'initial';
      },
      onmove: (event: any) => {
        const { target } = event;
        let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        // Limit the dragging boundary to not exceed the screen
        x = Math.min(
          screenWidth - target.offsetWidth + minWidth - 100,
          Math.max(-minWidth + 100, x)
        );
        y = Math.min(
          screenHeight - target.offsetHeight + minHeight - 100,
          Math.max(-minHeight + 100, y)
        );

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
      },
    })
    .resizable({
      edges: { top: true, left: true, bottom: true, right: true },
      listeners: {
        move(event) {
          let { x, y } = event.target.dataset;

          x = (parseFloat(x) || 0) + event.deltaRect.left;
          y = (parseFloat(y) || 0) + event.deltaRect.top;

          // Limit zoom minimum
          const width = Math.max(minWidth, event.rect.width);
          const height = Math.max(minHeight, event.rect.height);

          Object.assign(event.target.style, {
            width: `${width}px`,
            height: `${height}px`,
            transform: `translate(${x}px, ${y}px)`,
          });

          Object.assign(event.target.dataset, { x, y });

          roomService.emit(EventType.ROOM_CONTAINER_RESIZE);
        },
      },
    })
    .styleCursor(true);
};
