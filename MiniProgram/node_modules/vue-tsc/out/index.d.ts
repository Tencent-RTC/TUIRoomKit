import type * as ts from 'typescript/lib/tsserverlibrary';
import * as vue from '@vue/language-core';
import * as vueTs from '@vue/typescript';
export type Hook = (program: _Program) => void;
export type _Program = ts.Program & {
    __vue: ProgramContext;
};
interface ProgramContext {
    projectVersion: number;
    options: ts.CreateProgramOptions;
    languageHost: vue.TypeScriptLanguageHost;
    vueCompilerOptions: Partial<vue.VueCompilerOptions>;
    languageService: ReturnType<typeof vueTs.createLanguageService>;
}
export declare function createProgram(options: ts.CreateProgramOptions): _Program;
export {};
