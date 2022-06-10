
export { }

declare global {
  interface Window {
    removeLoading: () => void
    LibGenerateTestUserSig: (SDKAPPID: number, SECRETKEY: string, EXPIRETIME: number) => any;
  }
}
