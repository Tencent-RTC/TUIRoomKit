import { EmittedFile, GetModuleInfo } from 'rollup';
import { ResolvedConfig } from 'vite';
import { MiniProgramFilterOptions } from '@dcloudio/uni-cli-shared';
import { UniMiniProgramPluginOptions } from '.';
export declare function getFilterFiles(resolvedConfig: ResolvedConfig, getModuleInfo: GetModuleInfo): Record<string, MiniProgramFilterOptions>;
export declare function getTemplateFiles(template: UniMiniProgramPluginOptions['template']): Record<string, string>;
export declare const emitFile: (emittedFile: EmittedFile) => string;
