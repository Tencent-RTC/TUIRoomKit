import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import type { Options as VueOptions } from '@vitejs/plugin-vue';
import type ViteLegacyPlugin from '@vitejs/plugin-legacy';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';
import { CopyOptions } from '@dcloudio/uni-cli-shared';
export type ViteLegacyOptions = Parameters<typeof ViteLegacyPlugin>[0];
export interface VitePluginUniOptions {
    vueOptions?: VueOptions;
    vueJsxOptions?: (VueJSXPluginOptions & {
        babelPlugins?: any[];
    }) | boolean;
    viteLegacyOptions?: ViteLegacyOptions | false;
}
export interface VitePluginUniResolvedOptions extends VitePluginUniOptions {
    base: string;
    command: ResolvedConfig['command'];
    platform: UniApp.PLATFORM;
    inputDir: string;
    outputDir: string;
    assetsDir: string;
    devServer?: ViteDevServer;
    copyOptions?: Required<CopyOptions>;
}
export { runDev, runBuild } from './cli/action';
export default function uniPlugin(rawOptions?: VitePluginUniOptions): Plugin[];
