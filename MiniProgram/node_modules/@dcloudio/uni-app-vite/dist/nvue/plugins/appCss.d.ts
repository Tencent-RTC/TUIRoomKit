import type { Plugin } from 'vite';
import type { RollupError } from 'rollup';
import { CompilerError } from '@vue/compiler-sfc';
declare module '@vue/compiler-sfc' {
    interface SFCDescriptor {
        id: string;
    }
}
export declare const APP_CSS_JS = "./app.css.js";
export declare function uniAppCssPlugin(): Plugin;
export declare function createRollupError(id: string, error: CompilerError | SyntaxError): RollupError;
