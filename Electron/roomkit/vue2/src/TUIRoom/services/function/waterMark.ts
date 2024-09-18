import { EventType, IRoomService } from '../types';

interface IWaterMark {
  toggleWatermark(enabled: boolean): void;
  dispose(): void;
}
export class WaterMark implements IWaterMark {
  private service: IRoomService;
  private isWatermarkEnabled = false;

  constructor(service: IRoomService) {
    this.service = service;
    this.bindEvent();
  }

  private bindEvent() {
    this.service.on(EventType.ROOM_START, this.handleRoomStart);
    this.service.on(EventType.ROOM_JOIN, this.handleRoomJoin);
  }

  private handleRoomStart = () => {
    this.updateWatermarkVisibility(true);
  };

  private handleRoomJoin = () => {
    this.updateWatermarkVisibility(true);
  };

  public dispose() {
    this.service.off(EventType.ROOM_START, this.handleRoomStart);
    this.service.off(EventType.ROOM_JOIN, this.handleRoomJoin);
  }

  public toggleWatermark(enabled: boolean) {
    this.isWatermarkEnabled = enabled;
    this.updateWatermarkVisibility(enabled);
  }

  private updateWatermarkVisibility(enabled: boolean): void {
    const watermarkContainer = document.querySelector('.watermark-container');
    if (!enabled || !this.isWatermarkEnabled) {
      watermarkContainer?.remove();
      return;
    }
    if (!watermarkContainer) {
      const videoElement = document.querySelector('.content-container');
      const { userId, userName } = this.service.basicStore;
      this.addWatermark(videoElement, `${userName}(${userId})`);
    }
  }

  private addStyles() {
    const styles = `
          .watermark-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }
          .watermark {
            font-size: 16px;
            position: absolute;
            transform: rotate(-45deg);
            opacity: 0.3;
            word-wrap: break-word;
            text-align: center;
            color: #99A2B2;
            max-width: 400px;
            font-weight: 500;
          }
        `;

    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.appendChild(document.createTextNode(styles));
    document.head.appendChild(styleElement);
  }

  private addWatermark(targetElement: Element | null, watermarkText: string) {
    if (!targetElement) return;

    this.addStyles();

    let watermarkContainer = document.createElement('div');
    watermarkContainer.classList.add('watermark-container');
    targetElement.appendChild(watermarkContainer);

    const addWatermarkElements = () => {
      // clear old watermark elements
      watermarkContainer.innerHTML = '';

      // Calculate watermark spacing based on max width
      const maxWidth = 200;
      const watermarkSpacing = maxWidth + 25;

      for (
        let y = -watermarkSpacing;
        y < watermarkContainer.offsetHeight + watermarkSpacing;
        y += watermarkSpacing
      ) {
        for (
          let x = -watermarkSpacing;
          x < watermarkContainer.offsetWidth + watermarkSpacing;
          x += watermarkSpacing
        ) {
          const watermarkElement = document.createElement('div');
          watermarkElement.classList.add('watermark');
          watermarkElement.textContent = watermarkText;
          watermarkElement.style.left = `${x}px`;
          watermarkElement.style.top = `${y}px`;
          watermarkContainer.appendChild(watermarkElement);
        }
      }
    };

    addWatermarkElements();

    const resizeObserver = new ResizeObserver(addWatermarkElements);
    resizeObserver.observe(watermarkContainer);

    const observerCallback = (
      mutations: MutationRecord[],
      observer: MutationObserver
    ) => {
      mutations.forEach(mutation => {
        if (mutation.removedNodes.length > 0) {
          const removedWatermark = Array.from(mutation.removedNodes).some(
            node =>
              (node as HTMLElement).classList?.contains('watermark-container')
          );
          if (removedWatermark) {
            watermarkContainer = document.createElement('div');
            watermarkContainer.classList.add('watermark-container');
            targetElement.appendChild(watermarkContainer);
            addWatermarkElements();
            observer.disconnect();
            observeChanges();
          }
        }
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'style'
        ) {
          watermarkContainer.style.display = '';
        }
      });
    };

    const observeChanges = () => {
      const observer = new MutationObserver(observerCallback);
      observer.observe(targetElement, { childList: true });
      observer.observe(watermarkContainer, {
        attributes: true,
        attributeFilter: ['style'],
      });
    };

    observeChanges();
  }
}
