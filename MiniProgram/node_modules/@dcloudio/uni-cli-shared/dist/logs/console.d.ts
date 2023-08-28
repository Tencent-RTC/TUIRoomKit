export declare function rewriteConsoleExpr(method: string, id: string, filename: string, code: string, sourceMap?: boolean): {
    code: string;
    map: import("magic-string").SourceMap | null;
};
