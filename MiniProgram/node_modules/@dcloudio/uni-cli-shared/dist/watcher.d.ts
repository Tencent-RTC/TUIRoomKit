/// <reference types="node" />
import { FSWatcher, WatchOptions } from 'chokidar';
type FileTransform = (source: Buffer, filename: string) => void | string;
export interface FileWatcherOptions {
    src: string | string[];
    dest: string;
    transform?: FileTransform;
    verbose?: boolean;
}
export declare class FileWatcher {
    private src;
    private dest;
    private transform?;
    private verbose?;
    private watcher;
    private onChange?;
    constructor({ src, dest, transform, verbose }: FileWatcherOptions);
    watch(watchOptions: WatchOptions & {
        cwd: string;
    }, onReady?: (watcher: FSWatcher) => void, onChange?: () => void): FSWatcher;
    add(paths: string | ReadonlyArray<string>): FSWatcher;
    unwatch(paths: string | ReadonlyArray<string>): FSWatcher;
    close(): Promise<void>;
    copy(from: string): Promise<void | undefined>;
    remove(from: string): Promise<void | undefined>;
    info(type: 'close' | 'copy' | 'remove' | 'add' | 'unwatch', msg?: string | unknown): void;
    from(from: string): string;
    to(from: string): string;
}
export {};
