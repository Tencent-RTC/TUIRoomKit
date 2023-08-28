import type { Plugin } from 'postcss';
export interface UniAppCssProcessorOptions {
    unit?: string;
    unitRatio?: number;
    unitPrecision?: number;
}
declare const uniapp: {
    (opts?: UniAppCssProcessorOptions): Plugin;
    postcss: boolean;
};
export default uniapp;
