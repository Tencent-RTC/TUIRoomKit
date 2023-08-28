import { UserConfig, ResolverFunction } from 'vite';
import { VitePluginUniResolvedOptions } from '..';
export declare const customResolver: ResolverFunction;
export declare function createResolve(options: VitePluginUniResolvedOptions, _config: UserConfig): UserConfig['resolve'];
