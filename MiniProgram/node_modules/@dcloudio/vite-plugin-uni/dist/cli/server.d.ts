import type { ServerOptions, ViteDevServer } from 'vite';
import { CliOptions } from '.';
export declare function createServer(options: CliOptions & ServerOptions): Promise<ViteDevServer>;
export declare function createSSRServer(options: CliOptions & ServerOptions): Promise<ViteDevServer>;
