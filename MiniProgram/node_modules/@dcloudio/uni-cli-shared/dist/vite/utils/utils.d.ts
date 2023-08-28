import type { ConfigEnv, ResolvedConfig, UserConfig } from 'vite';
export declare function withSourcemap(config: ResolvedConfig): boolean;
export declare function isInHybridNVue(config: UserConfig | ResolvedConfig): boolean;
export declare function isSsr(command: ConfigEnv['command'], config: UserConfig | ResolvedConfig): boolean;
