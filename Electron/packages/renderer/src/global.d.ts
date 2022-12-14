
export { }

declare global {
  interface Window {
    removeLoading: () => void;
    isHasScreen: boolean;
  }
}
