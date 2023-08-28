import type { Plugin } from 'vite';
import { UniMiniProgramPluginOptions } from '../plugin';
export declare function uniSubpackagePlugin({ style: { extname }, }: UniMiniProgramPluginOptions): Plugin;
export declare function createNonAppGenerateBundle(extname: string): Plugin['generateBundle'];
