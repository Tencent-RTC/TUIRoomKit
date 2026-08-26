const nodeMap = new Map();

function isInside(el: HTMLElement, event: Event) {
  // composedPath is frozen at dispatch, so a click that unmounts its own
  // target (for example swapping a settings form for a language list) still
  // counts as inside. contains() misses the detached node and would close.
  if (typeof event.composedPath === 'function') {
    return event.composedPath().includes(el);
  }
  const target = event.target;
  return target instanceof Node && el.contains(target);
}

const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    const listenerFunction = (event: Event) => {
      if (isInside(el, event)) {
        return;
      }
      if (binding.value && typeof binding.value === 'function') {
        binding.value(event);
      }
    };
    if (!nodeMap.has(el)) {
      nodeMap.set(el, []);
    }
    const nodeCallbackList = nodeMap.get(el);
    nodeCallbackList.push(listenerFunction);
    document.addEventListener('click', listenerFunction);
    document.addEventListener('touchend', listenerFunction);
  },
  unmounted(el: HTMLElement) {
    const nodeCallbackList = nodeMap.get(el) || [];
    nodeCallbackList.forEach((callback: any) => {
      document.removeEventListener('click', callback);
      document.removeEventListener('touchend', callback);
    });
    nodeMap.delete(el);
  },
};

export default vClickOutside;
