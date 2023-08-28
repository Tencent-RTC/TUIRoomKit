import { ResolvedConfig } from 'vite';
import { FilterPattern } from '@rollup/pluginutils';
import { VitePluginUniResolvedOptions } from '../..';
export interface UniPluginFilterOptions extends VitePluginUniResolvedOptions {
    include?: FilterPattern;
    exclude?: FilterPattern;
}
export declare function initPlugins(config: ResolvedConfig, options: VitePluginUniResolvedOptions): void;
