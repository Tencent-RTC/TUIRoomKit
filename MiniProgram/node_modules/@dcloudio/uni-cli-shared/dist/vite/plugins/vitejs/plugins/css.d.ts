import { ExistingRawSourceMap, RollupError } from 'rollup';
import { Plugin } from '../plugin';
import { ResolvedConfig } from '../config';
import * as Postcss from 'postcss';
export interface CSSOptions {
    /**
     * https://github.com/css-modules/postcss-modules
     */
    modules?: CSSModulesOptions | false;
    preprocessorOptions?: Record<string, any>;
    postcss?: string | (Postcss.ProcessOptions & {
        plugins?: Postcss.Plugin[];
    });
}
export interface CSSModulesOptions {
    getJSON?: (cssFileName: string, json: Record<string, string>, outputFileName: string) => void;
    scopeBehaviour?: 'global' | 'local';
    globalModulePaths?: RegExp[];
    generateScopedName?: string | ((name: string, filename: string, css: string) => string);
    hashPrefix?: string;
    /**
     * default: null
     */
    localsConvention?: 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly' | null;
}
export declare const cssLangRE: RegExp;
export declare const commonjsProxyRE: RegExp;
export declare const isCSSRequest: (request: string) => boolean;
export declare const isDirectCSSRequest: (request: string) => boolean;
/**
 * Plugin applied before user plugins
 */
export declare function cssPlugin(config: ResolvedConfig): Plugin;
/**
 * Plugin applied after user plugins
 */
export declare function cssPostPlugin(config: ResolvedConfig, { platform, chunkCssFilename, chunkCssCode, }: {
    platform: UniApp.PLATFORM;
    chunkCssFilename: (id: string) => string | void;
    chunkCssCode: (filename: string, cssCode: string) => Promise<string> | string;
}): Plugin;
export declare function formatPostcssSourceMap(rawMap: ExistingRawSourceMap, file: string): ExistingRawSourceMap;
export declare const cssUrlRE: RegExp;
export declare const cssDataUriRE: RegExp;
export declare const importCssRE: RegExp;
export declare function minifyCSS(css: string, config: ResolvedConfig): Promise<string>;
export declare function hoistAtRules(css: string): Promise<string>;
export interface StylePreprocessorResults {
    code: string;
    map?: ExistingRawSourceMap | undefined;
    additionalMap?: ExistingRawSourceMap | undefined;
    errors: RollupError[];
    deps: string[];
}
