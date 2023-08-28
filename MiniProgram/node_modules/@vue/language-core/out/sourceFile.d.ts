import { FileCapabilities, VirtualFile, FileKind, FileRangeCapabilities, MirrorBehaviorCapabilities } from '@volar/language-core';
import { Mapping, Segment, StackNode, Stack } from '@volar/source-map';
import * as CompilerDom from '@vue/compiler-dom';
import type { SFCBlock, SFCParseResult, SFCScriptBlock, SFCStyleBlock, SFCTemplateBlock } from '@vue/compiler-sfc';
import { ComputedRef } from '@vue/reactivity';
import type * as ts from 'typescript/lib/tsserverlibrary';
import { Sfc, SfcBlock, VueLanguagePlugin } from './types';
import { VueCompilerOptions } from './types';
export declare class VueEmbeddedFile {
    fileName: string;
    content: Segment<FileRangeCapabilities>[];
    contentStacks: StackNode[];
    parentFileName?: string;
    kind: FileKind;
    capabilities: FileCapabilities;
    mirrorBehaviorMappings: Mapping<[MirrorBehaviorCapabilities, MirrorBehaviorCapabilities]>[];
    constructor(fileName: string, content: Segment<FileRangeCapabilities>[], contentStacks: StackNode[]);
}
export declare class VueFile implements VirtualFile {
    fileName: string;
    snapshot: ts.IScriptSnapshot;
    vueCompilerOptions: VueCompilerOptions;
    plugins: ReturnType<VueLanguagePlugin>[];
    ts: typeof import('typescript/lib/tsserverlibrary');
    codegenStack: boolean;
    parsedSfcCache: {
        snapshot: ts.IScriptSnapshot;
        sfc: SFCParseResult;
        plugin: ReturnType<VueLanguagePlugin>;
    } | undefined;
    compiledSFCTemplateCache: {
        template: string;
        snapshot: ts.IScriptSnapshot;
        result: CompilerDom.CodegenResult;
        plugin: ReturnType<VueLanguagePlugin>;
    } | undefined;
    capabilities: FileCapabilities;
    kind: FileKind;
    mappings: Mapping<FileRangeCapabilities>[];
    codegenStacks: Stack[];
    get compiledSFCTemplate(): {
        errors: CompilerDom.CompilerError[];
        warnings: CompilerDom.CompilerError[];
        ast: CompilerDom.RootNode | undefined;
    } | undefined;
    get mainScriptName(): string;
    get embeddedFiles(): VirtualFile[];
    sfc: Sfc;
    _sfcBlocks: ComputedRef<Record<string, SfcBlock>>;
    _compiledSfcTemplate: ComputedRef<{
        errors: CompilerDom.CompilerError[];
        warnings: CompilerDom.CompilerError[];
        ast: CompilerDom.RootNode | undefined;
    } | undefined>;
    _pluginEmbeddedFiles: ComputedRef<{
        file: VueEmbeddedFile;
        snapshot: ts.IScriptSnapshot;
        mappings: Mapping<FileRangeCapabilities>[];
        codegenStacks: Stack[];
    }[]>[];
    _allEmbeddedFiles: ComputedRef<{
        file: VueEmbeddedFile;
        snapshot: ts.IScriptSnapshot;
        mappings: Mapping<FileRangeCapabilities>[];
        codegenStacks: Stack[];
    }[]>;
    _embeddedFiles: ComputedRef<VirtualFile[]>;
    constructor(fileName: string, snapshot: ts.IScriptSnapshot, vueCompilerOptions: VueCompilerOptions, plugins: ReturnType<VueLanguagePlugin>[], ts: typeof import('typescript/lib/tsserverlibrary'), codegenStack: boolean);
    update(newScriptSnapshot: ts.IScriptSnapshot): void;
    onUpdate(): void;
    parseSfc(): SFCParseResult | undefined;
    parseTemplateBlock(block: SFCTemplateBlock): NonNullable<Sfc['template']>;
    parseScriptBlock(block: SFCScriptBlock): NonNullable<Sfc['script']>;
    parseScriptSetupBlock(block: SFCScriptBlock): NonNullable<Sfc['scriptSetup']>;
    parseStyleBlock(block: SFCStyleBlock, i: number): Sfc['styles'][number];
    parseCustomBlock(block: SFCBlock, i: number): Sfc['customBlocks'][number];
    parseBlock(block: SFCBlock): Omit<SfcBlock, 'name' | 'lang'>;
}
