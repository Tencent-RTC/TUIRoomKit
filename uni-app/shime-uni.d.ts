export { }

declare module "vue" {
  // eslint-disable-next-line no-undef
  type Hooks = App.AppInstance & Page.PageInstance;
  interface ComponentCustomOptions extends Hooks { }
}