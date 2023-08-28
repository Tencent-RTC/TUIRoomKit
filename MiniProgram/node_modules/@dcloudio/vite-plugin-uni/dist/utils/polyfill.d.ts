import { Plugin } from 'vite';
/**
 * TODO 临时重写，解决 @vitejs/plugin-vue 的 Bug
 */
export declare function rewriteCompilerSfcParse(): void;
/**
 * 解决 HBuilderX 项目未包含 package.json 时，initTSConfck 可能导致查找过慢，或递归目录时权限不足报错
 * 即：未包含 package.json 时，直接移除 initTSConfck 相关逻辑
 * @param inputDir
 * @returns
 */
export declare function initFixedEsbuildInitTSConfck(inputDir: string): Plugin[];
