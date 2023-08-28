"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initOptions = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonc_parser_1 = require("jsonc-parser");
function resolveBase() {
    const manifest = (0, jsonc_parser_1.parse)(fs_1.default.readFileSync(path_1.default.join(process.env.UNI_INPUT_DIR, 'manifest.json'), 'utf8'));
    return (manifest.h5 && manifest.h5.router && manifest.h5.router.base) || '/';
}
function initOptions(options, config) {
    options.base = resolveBase();
    options.outputDir = process.env.UNI_OUTPUT_DIR;
    options.assetsDir = config.build.assetsDir;
}
exports.initOptions = initOptions;
