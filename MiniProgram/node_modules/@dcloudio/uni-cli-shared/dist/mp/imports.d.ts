import { PluginContext } from 'rollup';
import { ImportSpecifier } from 'es-module-lexer';
/**
 * 暂时没用
 * @param source
 * @param importer
 * @param resolve
 * @returns
 */
export declare function findVueComponentImports(source: string, importer: string, resolve: PluginContext['resolve']): Promise<(ImportSpecifier & {
    i: string;
})[]>;
