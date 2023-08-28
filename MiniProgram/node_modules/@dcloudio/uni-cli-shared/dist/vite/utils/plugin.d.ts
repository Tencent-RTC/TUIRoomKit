import type { Plugin, ResolvedConfig } from 'vite';
export type CreateUniViteFilterPlugin = (opts: UniViteFilterPluginOptions) => Plugin;
export interface UniViteFilterPluginOptions {
    resolvedConfig: ResolvedConfig;
    filter: (id: string) => boolean;
}
export declare function injectAssetPlugin(config: ResolvedConfig): void;
export declare function injectCssPlugin(config: ResolvedConfig): void;
export declare function injectCssPostPlugin(config: ResolvedConfig, newCssPostPlugin: Plugin): void;
export declare function replacePlugins(plugins: Plugin[], config: ResolvedConfig): void;
export declare function removePlugins(plugins: string | string[], config: ResolvedConfig): void;
