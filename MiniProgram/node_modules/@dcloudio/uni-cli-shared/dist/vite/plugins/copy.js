"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniViteCopyPlugin = void 0;
const watcher_1 = require("../../watcher");
const messages_1 = require("../../messages");
const logs_1 = require("../../logs");
function uniViteCopyPlugin({ targets, verbose, }) {
    let resolvedConfig;
    let initialized = false;
    return {
        name: 'uni:copy',
        apply: 'build',
        configResolved(config) {
            resolvedConfig = config;
        },
        writeBundle() {
            if (initialized) {
                return;
            }
            if (resolvedConfig.build.ssr) {
                return;
            }
            initialized = true;
            return new Promise((resolve) => {
                Promise.all(targets.map(({ watchOptions, ...target }) => {
                    return new Promise((resolve) => {
                        new watcher_1.FileWatcher({
                            verbose,
                            ...target,
                        }).watch({
                            cwd: process.env.UNI_INPUT_DIR,
                            ...watchOptions,
                        }, (watcher) => {
                            if (process.env.NODE_ENV !== 'development') {
                                // 生产模式下，延迟 close，否则会影响 chokidar 初始化的 add 等事件
                                setTimeout(() => {
                                    watcher.close().then(() => resolve(void 0));
                                }, 2000);
                            }
                            else {
                                resolve(void 0);
                            }
                        }, () => {
                            // TODO 目前初始化编译时，也会不停地触发此函数。
                            (0, logs_1.output)('log', messages_1.M['dev.watching.end']);
                        });
                    });
                })).then(() => resolve());
            });
        },
    };
}
exports.uniViteCopyPlugin = uniViteCopyPlugin;
