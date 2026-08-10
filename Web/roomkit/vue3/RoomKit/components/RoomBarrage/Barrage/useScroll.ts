export const useScroll = () => {
  const scrollToBottom = (container: HTMLElement | null, behavior: ScrollBehavior = 'auto'): Promise<void> => new Promise((resolve) => {
    if (!container) {
      resolve();
      return;
    }

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });

      if (behavior === 'smooth') {
        const onScrollEnd = () => {
          container.removeEventListener('scrollend', onScrollEnd);
          setTimeout(() => {
            container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
            resolve();
          }, 100);
        };

        if ('onscrollend' in window) {
          container.addEventListener('scrollend', onScrollEnd);
        } else {
          setTimeout(() => {
            container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
            resolve();
          }, 500);
        }
      } else {
        resolve();
      }
    });
  });

  return {
    scrollToBottom,
  };
};
