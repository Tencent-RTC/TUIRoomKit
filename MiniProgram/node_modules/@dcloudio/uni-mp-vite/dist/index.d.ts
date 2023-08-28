import type { SFCScriptCompileOptions } from '@vue/compiler-sfc';
import { UniMiniProgramPluginOptions } from './plugin';
export { UniMiniProgramPluginOptions } from './plugin';
declare const _default: (options: UniMiniProgramPluginOptions) => (import("vite").Plugin | ((options: {
    vueOptions?: {
        script?: Partial<SFCScriptCompileOptions>;
    };
}) => import("vite").Plugin))[];
export default _default;
