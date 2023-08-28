"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileWatcher = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chokidar_1 = require("chokidar");
const shared_1 = require("@vue/shared");
const utils_1 = require("./utils");
class FileWatcher {
    constructor({ src, dest, transform, verbose }) {
        this.src = !(0, shared_1.isArray)(src) ? [src] : src;
        this.dest = dest;
        this.transform = transform;
        this.verbose = verbose;
    }
    watch(watchOptions, onReady, onChange) {
        if (!this.watcher) {
            const copy = this.copy.bind(this);
            const remove = this.remove.bind(this);
            // escape chokidar cwd
            const src = this.src.map((src) => (0, utils_1.pathToGlob)(path_1.default.resolve(watchOptions.cwd), src));
            this.watcher = (0, chokidar_1.watch)(src, watchOptions)
                .on('add', copy)
                .on('addDir', copy)
                .on('change', copy)
                .on('unlink', remove)
                .on('unlinkDir', remove)
                .on('ready', () => {
                onReady && onReady(this.watcher);
                setTimeout(() => {
                    this.onChange = onChange;
                }, 1000);
            })
                .on('error', (e) => console.error('watch', e));
        }
        return this.watcher;
    }
    add(paths) {
        this.info('add', paths);
        return this.watcher.add(paths);
    }
    unwatch(paths) {
        this.info('unwatch', paths);
        return this.watcher.unwatch(paths);
    }
    close() {
        this.info('close');
        return this.watcher.close();
    }
    copy(from) {
        const to = this.to(from);
        this.info('copy', from + '=>' + to);
        let content;
        if (this.transform) {
            const filename = this.from(from);
            content = this.transform(fs_extra_1.default.readFileSync(filename), filename);
        }
        if (content) {
            return fs_extra_1.default
                .outputFile(to, content)
                .catch(() => {
                // this.info('copy', e)
            })
                .then(() => this.onChange && this.onChange());
        }
        return fs_extra_1.default
            .copy(this.from(from), to, { overwrite: true })
            .catch(() => {
            // this.info('copy', e)
        })
            .then(() => this.onChange && this.onChange());
    }
    remove(from) {
        const to = this.to(from);
        this.info('remove', from + '=>' + to);
        return fs_extra_1.default
            .remove(to)
            .catch(() => {
            // this.info('remove', e)
        })
            .then(() => this.onChange && this.onChange());
    }
    info(type, msg) {
        this.verbose && console.log(type, msg);
    }
    from(from) {
        return path_1.default.join(this.watcher.options.cwd, from);
    }
    to(from) {
        return path_1.default.join(this.dest, from);
    }
}
exports.FileWatcher = FileWatcher;
