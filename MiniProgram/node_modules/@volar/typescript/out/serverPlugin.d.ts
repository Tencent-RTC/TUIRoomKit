import { VirtualFiles } from '@volar/language-core';
import type * as ts from 'typescript/lib/tsserverlibrary';
export declare function decorateLanguageServiceHost(virtualFiles: VirtualFiles, languageServiceHost: ts.LanguageServiceHost, ts: typeof import('typescript/lib/tsserverlibrary'), exts: string[]): void;
export declare function getExternalFiles(ts: typeof import('typescript/lib/tsserverlibrary'), project: ts.server.Project, exts: string[]): string[];
