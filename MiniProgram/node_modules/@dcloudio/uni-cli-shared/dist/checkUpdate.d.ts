interface CheckUpdateOptions {
    inputDir: string;
    compilerVersion: string;
    versionType: 'a' | 'r';
}
interface CheckUpdatePlatform {
    appid?: string;
    dev: number;
    build: number;
}
interface CheckUpdateCache {
    vid: string;
    lastCheck: number;
    newVersion?: string;
    note?: string;
    [name: string]: CheckUpdatePlatform | undefined | string | number;
}
export declare function checkUpdate(options: CheckUpdateOptions): Promise<void>;
/**
 * 检查本地缓存，返回 false 表示需要执行云端检查，返回 true 表示，无需云端检查，返回 string 表示，无需云端检测，且有更新
 * @param inputDir
 * @param compilerVersion
 * @param interval
 * @returns
 */
export declare function checkLocalCache(updateCache: CheckUpdateCache, compilerVersion: string, interval?: number): string | boolean;
export declare function md5(str: string): string;
export declare function getMac(): string;
export declare function createPostData({ versionType, compilerVersion }: CheckUpdateOptions, manifestJson: Record<string, any>, updateCache: CheckUpdateCache): string;
export {};
