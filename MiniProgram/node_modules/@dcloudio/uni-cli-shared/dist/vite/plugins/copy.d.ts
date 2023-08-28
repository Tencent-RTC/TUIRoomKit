import type { WatchOptions } from 'chokidar';
import type { Plugin } from 'vite';
import { FileWatcherOptions } from '../../watcher';
export type UniViteCopyPluginTarget = Omit<FileWatcherOptions, 'verbose'> & {
    watchOptions?: WatchOptions;
};
export interface UniViteCopyPluginOptions {
    targets: UniViteCopyPluginTarget[];
    verbose: boolean;
}
export declare function uniViteCopyPlugin({ targets, verbose, }: UniViteCopyPluginOptions): Plugin;
