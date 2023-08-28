"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJsDelivrFs = exports.createJsDelivrUriResolver = exports.decorateServiceEnvironment = exports.jsDelivrUriBase = void 0;
exports.jsDelivrUriBase = 'https://cdn.jsdelivr.net/npm';
function decorateServiceEnvironment(env, jsDelivrUriResolver, jsDelivrFs) {
    const fileNameToUri = env.fileNameToUri;
    const uriToFileName = env.uriToFileName;
    const fs = env.fs;
    env.fileNameToUri = fileName => {
        return jsDelivrUriResolver.fileNameToUri(fileName) ?? fileNameToUri(fileName);
    };
    env.uriToFileName = fileName => {
        return jsDelivrUriResolver.uriToFileName(fileName) ?? uriToFileName(fileName);
    };
    env.fs = {
        stat(uri) {
            if (jsDelivrUriResolver.uriToFileName(uri)) {
                return jsDelivrFs.stat(uri);
            }
            return fs?.stat(uri);
        },
        readDirectory(uri) {
            if (jsDelivrUriResolver.uriToFileName(uri)) {
                return jsDelivrFs.readDirectory(uri);
            }
            return fs?.readDirectory(uri) ?? [];
        },
        readFile(uri) {
            if (jsDelivrUriResolver.uriToFileName(uri)) {
                return jsDelivrFs.readFile(uri);
            }
            return fs?.readFile(uri);
        },
    };
}
exports.decorateServiceEnvironment = decorateServiceEnvironment;
function createJsDelivrUriResolver(versions = {}, fileNameBase = '/node_modules') {
    return {
        uriToFileName,
        fileNameToUri,
    };
    function uriToFileName(uri) {
        if (uri === exports.jsDelivrUriBase) {
            return fileNameBase;
        }
        if (uri.startsWith(exports.jsDelivrUriBase + '/')) {
            const path = uri.substring(exports.jsDelivrUriBase.length);
            const pkgName = getPackageName(path);
            if (pkgName?.substring(1).includes('@')) {
                const trimedVersion = pkgName.substring(0, pkgName.lastIndexOf('@'));
                return `${fileNameBase}${path.replace(pkgName, trimedVersion)}`;
            }
            return `${fileNameBase}${path}`;
        }
    }
    function fileNameToUri(fileName) {
        if (fileName === fileNameBase) {
            return exports.jsDelivrUriBase;
        }
        if (fileName.startsWith(fileNameBase + '/')) {
            const path = fileName.substring(fileNameBase.length);
            const pkgName = getPackageName(path);
            if (pkgName) {
                const version = versions[pkgName] ?? 'latest';
                return `${exports.jsDelivrUriBase}/${pkgName}@${version}${path.substring(1 + pkgName.length)}`;
            }
            return `${exports.jsDelivrUriBase}${path}`;
        }
    }
}
exports.createJsDelivrUriResolver = createJsDelivrUriResolver;
function createJsDelivrFs() {
    const fetchResults = new Map();
    const flatResults = new Map();
    return {
        stat,
        readDirectory,
        readFile,
    };
    function stat(uri) {
        if (uri === exports.jsDelivrUriBase) {
            return {
                type: 2,
                size: -1,
                ctime: -1,
                mtime: -1,
            };
        }
        if (uri.startsWith(exports.jsDelivrUriBase + '/')) {
            const path = uri.substring(exports.jsDelivrUriBase.length);
            const pkgName = getPackageName(path);
            if (!pkgName || !isValidPackageNameSync(pkgName)) {
                return;
            }
            return (async () => {
                if (!await isValidPackageNameAsync(pkgName)) {
                    return;
                }
                if (!flatResults.has(pkgName)) {
                    flatResults.set(pkgName, flat(pkgName));
                }
                const flatResult = await flatResults.get(pkgName);
                const filePath = path.slice(`/${pkgName}`.length);
                const file = flatResult.find(file => file.name === filePath);
                if (file) {
                    return {
                        type: 1,
                        ctime: new Date(file.time).valueOf(),
                        mtime: new Date(file.time).valueOf(),
                        size: file.size,
                    };
                }
                else if (flatResult.some(file => file.name.startsWith(filePath + '/'))) {
                    return {
                        type: 2,
                        ctime: -1,
                        mtime: -1,
                        size: -1,
                    };
                }
            })();
        }
    }
    function readDirectory(uri) {
        if (uri.startsWith(exports.jsDelivrUriBase + '/')) {
            const path = uri.substring(exports.jsDelivrUriBase.length);
            const pkgName = getPackageName(path);
            if (!pkgName || !isValidPackageNameSync(pkgName)) {
                return [];
            }
            return (async () => {
                if (!await isValidPackageNameAsync(pkgName)) {
                    return [];
                }
                if (!flatResults.has(pkgName)) {
                    flatResults.set(pkgName, flat(pkgName));
                }
                const flatResult = await flatResults.get(pkgName);
                const dirPath = path.slice(`/${pkgName}`.length);
                const files = flatResult
                    .filter(f => f.name.substring(0, f.name.lastIndexOf('/')) === dirPath)
                    .map(f => f.name.slice(dirPath.length + 1));
                const dirs = flatResult
                    .filter(f => f.name.startsWith(dirPath + '/') && f.name.substring(dirPath.length + 1).split('/').length >= 2)
                    .map(f => f.name.slice(dirPath.length + 1).split('/')[0]);
                return [
                    ...files.map(f => [f, 1]),
                    ...[...new Set(dirs)].map(f => [f, 2]),
                ];
            })();
        }
        return [];
    }
    function readFile(uri) {
        if (uri.startsWith(exports.jsDelivrUriBase + '/')) {
            const path = uri.substring(exports.jsDelivrUriBase.length);
            const pkgName = getPackageName(path);
            if (!pkgName || !isValidPackageNameSync(pkgName)) {
                return;
            }
            return (async () => {
                if (!await isValidPackageNameAsync(pkgName)) {
                    return;
                }
                if (!fetchResults.has(path)) {
                    fetchResults.set(path, (async () => {
                        if ((await stat(uri))?.type !== 1) {
                            return;
                        }
                        return await fetchText(uri);
                    })());
                }
                return await fetchResults.get(path);
            })();
        }
    }
    async function flat(pkgNameWithVersion) {
        let pkgName = pkgNameWithVersion;
        let version = 'latest';
        if (pkgNameWithVersion.substring(1).includes('@')) {
            pkgName = pkgNameWithVersion.substring(0, pkgNameWithVersion.lastIndexOf('@'));
            version = pkgNameWithVersion.substring(pkgNameWithVersion.lastIndexOf('@') + 1);
        }
        // resolve tag version
        if (version === 'latest') {
            const data = await fetchJson(`https://data.jsdelivr.com/v1/package/resolve/npm/${pkgName}@latest`);
            if (!data?.version) {
                return [];
            }
            version = data.version;
        }
        const flat = await fetchJson(`https://data.jsdelivr.com/v1/package/npm/${pkgName}@${version}/flat`);
        if (!flat) {
            return [];
        }
        return flat.files;
    }
    function isValidPackageNameSync(pkgName) {
        if (pkgName.substring(1).includes('@')) {
            pkgName = pkgName.substring(0, pkgName.lastIndexOf('@'));
        }
        if (pkgName.indexOf('.') >= 0 || pkgName.endsWith('/node_modules')) {
            return false;
        }
        // hard code for known invalid package
        if (pkgName.startsWith('@typescript/') || pkgName.startsWith('@types/typescript__')) {
            return false;
        }
        return true;
    }
    async function isValidPackageNameAsync(pkgName) {
        if (pkgName.substring(1).includes('@')) {
            pkgName = pkgName.substring(0, pkgName.lastIndexOf('@'));
        }
        // don't check @types if original package already having types
        if (pkgName.startsWith('@types/')) {
            let originalPkgName = pkgName.slice('@types/'.length);
            if (originalPkgName.indexOf('__') >= 0) {
                originalPkgName = '@' + originalPkgName.replace('__', '/');
            }
            const packageJson = await readFile(`${exports.jsDelivrUriBase}/${originalPkgName}/package.json`);
            if (packageJson) {
                const packageJsonObj = JSON.parse(packageJson);
                if (packageJsonObj.types || packageJsonObj.typings) {
                    return false;
                }
                const indexDts = await stat(`${exports.jsDelivrUriBase}/${originalPkgName}/index.d.ts`);
                if (indexDts?.type === 1) {
                    return false;
                }
            }
        }
        return true;
    }
}
exports.createJsDelivrFs = createJsDelivrFs;
async function fetchText(url) {
    try {
        const res = await fetch(url);
        if (res.status === 200) {
            return await res.text();
        }
    }
    catch {
        // ignore
    }
}
async function fetchJson(url) {
    try {
        const res = await fetch(url);
        if (res.status === 200) {
            return await res.json();
        }
    }
    catch {
        // ignore
    }
}
/**
 * @example
 * "/a/b/c" -> "a"
 * "/@a/b/c" -> "@a/b"
 * "/@a/b@1.2.3/c" -> "@a/b@1.2.3"
 */
function getPackageName(path) {
    const parts = path.split('/');
    let pkgName = parts[1];
    if (pkgName.startsWith('@')) {
        if (parts.length < 3 || !parts[2]) {
            return undefined;
        }
        pkgName += '/' + parts[2];
    }
    return pkgName;
}
//# sourceMappingURL=dtsHost.js.map