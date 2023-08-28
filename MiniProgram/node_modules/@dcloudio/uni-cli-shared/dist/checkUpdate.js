"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPostData = exports.getMac = exports.md5 = exports.checkLocalCache = exports.checkUpdate = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const debug_1 = __importDefault(require("debug"));
const crypto_1 = __importDefault(require("crypto"));
const https_1 = require("https");
const compare_versions_1 = __importDefault(require("compare-versions"));
const shared_1 = require("@vue/shared");
const json_1 = require("./json");
const hbx_1 = require("./hbx");
const debugCheckUpdate = (0, debug_1.default)('uni:check-update');
const INTERVAL = 1000 * 60 * 60 * 24;
async function checkUpdate(options) {
    if (process.env.CI) {
        debugCheckUpdate('isInCI');
        return;
    }
    if ((0, hbx_1.isInHBuilderX)()) {
        debugCheckUpdate('isInHBuilderX');
        return;
    }
    const { inputDir, compilerVersion } = options;
    const updateCache = readCheckUpdateCache(inputDir);
    debugCheckUpdate('read.cache', updateCache);
    const res = checkLocalCache(updateCache, compilerVersion);
    if (res) {
        if ((0, shared_1.isString)(res)) {
            console.log();
            console.log(res);
        }
    }
    else {
        await checkVersion(options, normalizeUpdateCache(updateCache, (0, json_1.parseManifestJsonOnce)(inputDir)));
    }
    writeCheckUpdateCache(inputDir, statUpdateCache(normalizeUpdateCache(updateCache)));
}
exports.checkUpdate = checkUpdate;
function normalizeUpdateCache(updateCache, manifestJson) {
    const platform = process.env.UNI_PLATFORM;
    if (!updateCache[platform]) {
        updateCache[platform] = {
            appid: '',
            dev: 0,
            build: 0,
        };
    }
    if (manifestJson) {
        const platformOptions = manifestJson[platform === 'app' ? 'app-plus' : platform];
        updateCache[platform].appid = platformOptions
            ? platformOptions.appid || platformOptions.package || ''
            : '';
    }
    return updateCache;
}
function statUpdateCache(updateCache) {
    debugCheckUpdate('stat.before', updateCache);
    const platform = process.env.UNI_PLATFORM;
    const type = process.env.NODE_ENV === 'production' ? 'build' : 'dev';
    const platformOptions = updateCache[platform];
    platformOptions[type] = (platformOptions[type] || 0) + 1;
    debugCheckUpdate('stat.after', updateCache);
    return updateCache;
}
function getFilepath(inputDir, filename) {
    return path_1.default.resolve(os_1.default.tmpdir(), 'uni-app-cli', md5(inputDir), filename);
}
function getCheckUpdateFilepath(inputDir) {
    return getFilepath(inputDir, 'check-update.json');
}
function generateVid() {
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += ((65536 * (1 + Math.random())) | 0).toString(16).substring(1);
    }
    return 'UNI_' + result.toUpperCase();
}
function createCheckUpdateCache(vid = generateVid()) {
    return {
        vid: generateVid(),
        lastCheck: 0,
    };
}
function readCheckUpdateCache(inputDir) {
    const updateFilepath = getCheckUpdateFilepath(inputDir);
    debugCheckUpdate('read:', updateFilepath);
    if (fs_extra_1.default.existsSync(updateFilepath)) {
        try {
            return require(updateFilepath);
        }
        catch (e) {
            debugCheckUpdate('read.error', e);
        }
    }
    return createCheckUpdateCache();
}
/**
 * 检查本地缓存，返回 false 表示需要执行云端检查，返回 true 表示，无需云端检查，返回 string 表示，无需云端检测，且有更新
 * @param inputDir
 * @param compilerVersion
 * @param interval
 * @returns
 */
function checkLocalCache(updateCache, compilerVersion, interval = INTERVAL) {
    if (!updateCache.lastCheck) {
        debugCheckUpdate('cache: lastCheck not found');
        return false;
    }
    if (Date.now() - updateCache.lastCheck > interval) {
        debugCheckUpdate('cache: lastCheck > interval');
        return false;
    }
    if (updateCache.newVersion &&
        (0, compare_versions_1.default)(updateCache.newVersion, compilerVersion) > 0) {
        debugCheckUpdate('cache: find new version');
        return updateCache.note;
    }
    return true;
}
exports.checkLocalCache = checkLocalCache;
function writeCheckUpdateCache(inputDir, updateCache) {
    const filepath = getCheckUpdateFilepath(inputDir);
    debugCheckUpdate('write:', filepath, updateCache);
    try {
        fs_extra_1.default.outputFileSync(filepath, JSON.stringify(updateCache));
    }
    catch (e) {
        debugCheckUpdate('write.error', e);
    }
}
function md5(str) {
    return crypto_1.default.createHash('md5').update(str).digest('hex');
}
exports.md5 = md5;
function getMac() {
    let mac = '';
    const network = os_1.default.networkInterfaces();
    for (const key in network) {
        const array = network[key];
        for (let i = 0; i < array.length; i++) {
            const item = array[i];
            if (!item.family || (item.mac && item.mac === '00:00:00:00:00:00')) {
                continue;
            }
            if (
            // Node < v18
            (0, shared_1.isString)(item.family) &&
                (item.family === 'IPv4' || item.family === 'IPv6')) {
                mac = item.mac;
                break;
            }
            else if (
            // Node >= v18
            typeof item.family === 'number' &&
                // @ts-ignore
                (item.family === 4 || item.family === 6)) {
                mac = item.mac;
                break;
            }
        }
    }
    return mac;
}
exports.getMac = getMac;
function createPostData({ versionType, compilerVersion }, manifestJson, updateCache) {
    const data = {
        vv: 3,
        device: md5(getMac()),
        vtype: versionType,
        vcode: compilerVersion,
    };
    if (manifestJson.appid) {
        data.appid = manifestJson.appid;
    }
    else {
        data.vid = updateCache.vid;
    }
    Object.keys(updateCache).forEach((name) => {
        const value = updateCache[name];
        if ((0, shared_1.isPlainObject)(value) &&
            ((0, shared_1.hasOwn)(value, 'dev') || (0, shared_1.hasOwn)(value, 'build'))) {
            data[name] = value;
        }
    });
    return JSON.stringify(data);
}
exports.createPostData = createPostData;
function handleCheckVersion({ code, isUpdate, newVersion, note }, updateCache) {
    if (code !== 0) {
        return;
    }
    // clear
    Object.keys(updateCache).forEach((key) => {
        if (key !== 'vid')
            delete updateCache[key];
    });
    updateCache.lastCheck = Date.now();
    if (isUpdate) {
        updateCache.note = note;
        updateCache.newVersion = newVersion;
    }
    else {
        delete updateCache.note;
        delete updateCache.newVersion;
    }
}
const HOSTNAME = 'uniapp.dcloud.net.cn';
const PATH = '/update/cli';
function checkVersion(options, updateCache) {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            id: createPostData(options, (0, json_1.parseManifestJsonOnce)(options.inputDir), updateCache),
        });
        let responseData = '';
        const req = (0, https_1.request)({
            hostname: HOSTNAME,
            path: PATH,
            port: 443,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
            },
        }, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                debugCheckUpdate('response: ', responseData);
                try {
                    handleCheckVersion(JSON.parse(responseData), updateCache);
                }
                catch (e) { }
                resolve(true);
            });
            res.on('error', (e) => {
                debugCheckUpdate('response.error:', e);
                resolve(false);
            });
        }).on('error', (e) => {
            debugCheckUpdate('request.error:', e);
            resolve(false);
        });
        debugCheckUpdate('request: ', postData);
        req.write(postData);
        req.end();
    });
}
