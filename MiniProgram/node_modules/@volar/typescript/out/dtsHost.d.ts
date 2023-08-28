import { FileSystem, ServiceEnvironment } from '@volar/language-service';
export declare const jsDelivrUriBase = "https://cdn.jsdelivr.net/npm";
export declare function decorateServiceEnvironment(env: ServiceEnvironment, jsDelivrUriResolver: ReturnType<typeof createJsDelivrUriResolver>, jsDelivrFs: FileSystem): void;
export declare function createJsDelivrUriResolver(versions?: Record<string, string>, fileNameBase?: string): {
    uriToFileName: (uri: string) => string | undefined;
    fileNameToUri: (fileName: string) => string | undefined;
};
export declare function createJsDelivrFs(): FileSystem;
