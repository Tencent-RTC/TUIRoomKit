import { CliOptions } from '.';
import { RollupWatcher } from 'rollup';
export declare function build(options: CliOptions): Promise<RollupWatcher | void>;
export declare function buildSSR(options: CliOptions): Promise<void>;
export declare function buildApp(options: CliOptions): Promise<RollupWatcher | void>;
