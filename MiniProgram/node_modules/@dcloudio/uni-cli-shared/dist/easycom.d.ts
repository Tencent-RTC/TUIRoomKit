interface EasycomOption {
    dirs?: string[];
    rootDir: string;
    extensions?: string[];
    autoscan?: boolean;
    custom?: EasycomCustom;
}
export interface EasycomMatcher {
    pattern: RegExp;
    replacement: string;
}
interface EasycomCustom {
    [key: string]: string;
}
export declare function initEasycoms(inputDir: string, { dirs, platform }: {
    dirs: string[];
    platform: UniApp.PLATFORM;
}): {
    options: EasycomOption;
    filter: (id: unknown) => boolean;
    refresh(): void;
    easycoms: EasycomMatcher[];
};
export declare const initEasycomsOnce: typeof initEasycoms;
export declare function matchEasycom(tag: string): string | false | undefined;
export declare function addImportDeclaration(importDeclarations: string[], local: string, source: string, imported?: string): string;
export declare function genResolveEasycomCode(importDeclarations: string[], code: string, name: string): string;
export declare const UNI_EASYCOM_EXCLUDE: RegExp[];
export {};
