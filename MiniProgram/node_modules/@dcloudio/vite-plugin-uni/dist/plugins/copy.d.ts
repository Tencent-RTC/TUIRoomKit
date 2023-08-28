import type { Plugin } from 'vite';
import { VitePluginUniResolvedOptions } from '..';
export declare function uniCopyPlugin({ outputDir, copyOptions, }: Pick<VitePluginUniResolvedOptions, 'outputDir' | 'copyOptions'>): Plugin;
