"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNI_EASYCOM_EXCLUDE = exports.genResolveEasycomCode = exports.addImportDeclaration = exports.matchEasycom = exports.initEasycomsOnce = exports.initEasycoms = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const debug_1 = __importDefault(require("debug"));
const shared_1 = require("@vue/shared");
const pluginutils_1 = require("@rollup/pluginutils");
const uni_shared_1 = require("@dcloudio/uni-shared");
const utils_1 = require("./utils");
const pages_1 = require("./json/pages");
const messages_1 = require("./messages");
const uts_1 = require("./uts");
const debugEasycom = (0, debug_1.default)('uni:easycom');
const easycoms = [];
const easycomsCache = new Map();
const easycomsInvalidCache = new Set();
let hasEasycom = false;
function clearEasycom() {
    easycoms.length = 0;
    easycomsCache.clear();
    easycomsInvalidCache.clear();
}
function initEasycoms(inputDir, { dirs, platform }) {
    const componentsDir = path_1.default.resolve(inputDir, 'components');
    const uniModulesDir = path_1.default.resolve(inputDir, 'uni_modules');
    const initEasycomOptions = (pagesJson) => {
        // 初始化时，从once中读取缓存，refresh时，实时读取
        const { easycom } = pagesJson || (0, pages_1.parsePagesJson)(inputDir, platform, false);
        const easycomOptions = {
            dirs: easycom && easycom.autoscan === false
                ? [...dirs] // 禁止自动扫描
                : [
                    ...dirs,
                    componentsDir,
                    ...initUniModulesEasycomDirs(uniModulesDir),
                ],
            rootDir: inputDir,
            autoscan: !!(easycom && easycom.autoscan),
            custom: (easycom && easycom.custom) || {},
        };
        debugEasycom(easycomOptions);
        return easycomOptions;
    };
    const options = initEasycomOptions((0, pages_1.parsePagesJsonOnce)(inputDir, platform));
    const initUTSEasycom = () => {
        (0, uts_1.initUTSComponents)(inputDir, platform).forEach((item) => {
            const index = easycoms.findIndex((easycom) => item.pattern.toString() === easycom.pattern.toString());
            if (index > -1) {
                easycoms.splice(index, 1, item);
            }
            else {
                easycoms.push(item);
            }
        });
    };
    initEasycom(options);
    initUTSEasycom();
    const res = {
        options,
        filter: (0, pluginutils_1.createFilter)([
            'components/*/*.(vue|jsx|tsx)',
            'uni_modules/*/components/*/*.(vue|jsx|tsx)',
            'utssdk/*/**/*.vue',
            'uni_modules/*/utssdk/*/*.vue',
        ], [], {
            resolve: inputDir,
        }),
        refresh() {
            res.options = initEasycomOptions();
            initEasycom(res.options);
            initUTSEasycom();
        },
        easycoms,
    };
    return res;
}
exports.initEasycoms = initEasycoms;
exports.initEasycomsOnce = (0, uni_shared_1.once)(initEasycoms);
function initUniModulesEasycomDirs(uniModulesDir) {
    if (!fs_1.default.existsSync(uniModulesDir)) {
        return [];
    }
    return fs_1.default
        .readdirSync(uniModulesDir)
        .map((uniModuleDir) => {
        const uniModuleComponentsDir = path_1.default.resolve(uniModulesDir, uniModuleDir, 'components');
        if (fs_1.default.existsSync(uniModuleComponentsDir)) {
            return uniModuleComponentsDir;
        }
    })
        .filter(Boolean);
}
function initEasycom({ dirs, rootDir, custom, extensions = ['.vue', '.jsx', '.tsx'], }) {
    clearEasycom();
    const easycomsObj = Object.create(null);
    if (dirs && dirs.length && rootDir) {
        (0, shared_1.extend)(easycomsObj, initAutoScanEasycoms(dirs, rootDir, extensions));
    }
    if (custom) {
        Object.keys(custom).forEach((name) => {
            const componentPath = custom[name];
            easycomsObj[name] = componentPath.startsWith('@/')
                ? (0, utils_1.normalizePath)(path_1.default.join(rootDir, componentPath.slice(2)))
                : componentPath;
        });
    }
    Object.keys(easycomsObj).forEach((name) => {
        easycoms.push({
            pattern: new RegExp(name),
            replacement: easycomsObj[name],
        });
    });
    debugEasycom(easycoms);
    hasEasycom = !!easycoms.length;
    return easycoms;
}
function matchEasycom(tag) {
    if (!hasEasycom) {
        return;
    }
    let source = easycomsCache.get(tag);
    if (source) {
        return source;
    }
    if (easycomsInvalidCache.has(tag)) {
        return false;
    }
    const matcher = easycoms.find((matcher) => matcher.pattern.test(tag));
    if (!matcher) {
        easycomsInvalidCache.add(tag);
        return false;
    }
    source = tag.replace(matcher.pattern, matcher.replacement);
    easycomsCache.set(tag, source);
    debugEasycom('matchEasycom', tag, source);
    return source;
}
exports.matchEasycom = matchEasycom;
const isDir = (path) => fs_1.default.lstatSync(path).isDirectory();
function initAutoScanEasycom(dir, rootDir, extensions) {
    if (!path_1.default.isAbsolute(dir)) {
        dir = path_1.default.resolve(rootDir, dir);
    }
    const easycoms = Object.create(null);
    if (!fs_1.default.existsSync(dir)) {
        return easycoms;
    }
    fs_1.default.readdirSync(dir).forEach((name) => {
        const folder = path_1.default.resolve(dir, name);
        if (!isDir(folder)) {
            return;
        }
        const importDir = (0, utils_1.normalizePath)(folder);
        const files = fs_1.default.readdirSync(folder);
        // 读取文件夹文件列表，比对文件名（fs.existsSync在大小写不敏感的系统会匹配不准确）
        for (let i = 0; i < extensions.length; i++) {
            const ext = extensions[i];
            if (files.includes(name + ext)) {
                easycoms[`^${name}$`] = `${importDir}/${name}${ext}`;
                break;
            }
        }
    });
    return easycoms;
}
function initAutoScanEasycoms(dirs, rootDir, extensions) {
    const conflict = {};
    const res = dirs.reduce((easycoms, dir) => {
        const curEasycoms = initAutoScanEasycom(dir, rootDir, extensions);
        Object.keys(curEasycoms).forEach((name) => {
            // Use the first component when name conflict
            const componentPath = easycoms[name];
            if (!componentPath) {
                easycoms[name] = curEasycoms[name];
            }
            else {
                ;
                (conflict[componentPath] || (conflict[componentPath] = [])).push(normalizeComponentPath(curEasycoms[name], rootDir));
            }
        });
        return easycoms;
    }, Object.create(null));
    const conflictComponents = Object.keys(conflict);
    if (conflictComponents.length) {
        console.warn(messages_1.M['easycom.conflict']);
        conflictComponents.forEach((com) => {
            console.warn([normalizeComponentPath(com, rootDir), conflict[com]].join(','));
        });
    }
    return res;
}
function normalizeComponentPath(componentPath, rootDir) {
    return (0, utils_1.normalizePath)(path_1.default.relative(rootDir, componentPath));
}
function addImportDeclaration(importDeclarations, local, source, imported) {
    importDeclarations.push(createImportDeclaration(local, source, imported));
    return local;
}
exports.addImportDeclaration = addImportDeclaration;
function createImportDeclaration(local, source, imported) {
    if (imported) {
        return `import { ${imported} as ${local} } from '${source}';`;
    }
    return `import ${local} from '${source}';`;
}
const RESOLVE_EASYCOM_IMPORT_CODE = `import { resolveDynamicComponent as __resolveDynamicComponent } from 'vue';import { resolveEasycom } from '@dcloudio/uni-app';`;
function genResolveEasycomCode(importDeclarations, code, name) {
    if (!importDeclarations.includes(RESOLVE_EASYCOM_IMPORT_CODE)) {
        importDeclarations.push(RESOLVE_EASYCOM_IMPORT_CODE);
    }
    return `resolveEasycom(${code.replace('_resolveComponent', '__resolveDynamicComponent')}, ${name})`;
}
exports.genResolveEasycomCode = genResolveEasycomCode;
exports.UNI_EASYCOM_EXCLUDE = [/App.vue$/, /@dcloudio\/uni-h5/];
