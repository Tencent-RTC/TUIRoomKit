import * as UTSCompiler from '@dcloudio/uni-uts-v1';
import type { EasycomMatcher } from './easycom';
/**
 * 解析 app 平台的 uts 插件，任意平台（android|ios）存在即可
 * @param id
 * @param importer
 * @returns
 */
export declare function resolveUTSAppModule(id: string, importer: string): string | undefined;
export declare function resolveUTSModule(id: string, importer: string): string | undefined;
export declare function resolveUTSCompiler(): typeof UTSCompiler;
export declare function initUTSComponents(inputDir: string, platform: UniApp.PLATFORM): EasycomMatcher[];
