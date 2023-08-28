import { Segment } from '@volar/source-map';
import { FileRangeCapabilities, MirrorBehaviorCapabilities } from '@volar/language-core';
import * as SourceMaps from '@volar/source-map';
import type * as ts from 'typescript/lib/tsserverlibrary';
import type * as templateGen from '../generators/template';
import type { ScriptRanges } from '../parsers/scriptRanges';
import type { ScriptSetupRanges } from '../parsers/scriptSetupRanges';
import { Sfc } from '../types';
import type { VueCompilerOptions } from '../types';
export declare function generate(ts: typeof import('typescript/lib/tsserverlibrary'), fileName: string, _sfc: Sfc, lang: string, scriptRanges: ScriptRanges | undefined, scriptSetupRanges: ScriptSetupRanges | undefined, htmlGen: ReturnType<typeof templateGen['generate']> | undefined, compilerOptions: ts.CompilerOptions, vueCompilerOptions: VueCompilerOptions, codegenStack: boolean): {
    codes: Segment<FileRangeCapabilities>[];
    codeStacks: SourceMaps.StackNode[];
    mirrorBehaviorMappings: SourceMaps.Mapping<[MirrorBehaviorCapabilities, MirrorBehaviorCapabilities]>[];
};
