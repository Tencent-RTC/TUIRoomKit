"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VueFile = exports.VueEmbeddedFile = void 0;
const language_core_1 = require("@volar/language-core");
const source_map_1 = require("@volar/source-map");
const reactivity_1 = require("@vue/reactivity");
const muggle = require("muggle-string");
const parseCssVars_1 = require("./utils/parseCssVars");
const parseCssClassNames_1 = require("./utils/parseCssClassNames");
const jsxReg = /^\.(js|ts)x?$/;
class VueEmbeddedFile {
    constructor(fileName, content, contentStacks) {
        this.fileName = fileName;
        this.content = content;
        this.contentStacks = contentStacks;
        this.kind = language_core_1.FileKind.TextFile;
        this.capabilities = {};
        this.mirrorBehaviorMappings = [];
    }
}
exports.VueEmbeddedFile = VueEmbeddedFile;
class VueFile {
    get compiledSFCTemplate() {
        return this._compiledSfcTemplate.value;
    }
    get mainScriptName() {
        return this._allEmbeddedFiles.value.find(e => e.file.fileName.replace(this.fileName, '').match(jsxReg))?.file.fileName ?? '';
    }
    get embeddedFiles() {
        return this._embeddedFiles.value;
    }
    constructor(fileName, snapshot, vueCompilerOptions, plugins, ts, codegenStack) {
        this.fileName = fileName;
        this.snapshot = snapshot;
        this.vueCompilerOptions = vueCompilerOptions;
        this.plugins = plugins;
        this.ts = ts;
        this.codegenStack = codegenStack;
        this.capabilities = language_core_1.FileCapabilities.full;
        this.kind = language_core_1.FileKind.TextFile;
        this.mappings = [];
        this.codegenStacks = [];
        // refs
        this.sfc = (0, reactivity_1.reactive)({
            template: null,
            script: null,
            scriptSetup: null,
            styles: [],
            customBlocks: [],
            templateAst: (0, reactivity_1.computed)(() => {
                return this._compiledSfcTemplate.value?.ast;
            }),
            scriptAst: (0, reactivity_1.computed)(() => {
                if (this.sfc.script) {
                    return this.ts.createSourceFile(this.fileName + '.' + this.sfc.script.lang, this.sfc.script.content, this.ts.ScriptTarget.Latest);
                }
            }),
            scriptSetupAst: (0, reactivity_1.computed)(() => {
                if (this.sfc.scriptSetup) {
                    return this.ts.createSourceFile(this.fileName + '.' + this.sfc.scriptSetup.lang, this.sfc.scriptSetup.content, this.ts.ScriptTarget.Latest);
                }
            }),
        }) /* avoid Sfc unwrap in .d.ts by reactive */;
        // computed
        this._sfcBlocks = (0, reactivity_1.computed)(() => {
            const blocks = {};
            if (this.sfc.template) {
                blocks[this.sfc.template.name] = this.sfc.template;
            }
            if (this.sfc.script) {
                blocks[this.sfc.script.name] = this.sfc.script;
            }
            if (this.sfc.scriptSetup) {
                blocks[this.sfc.scriptSetup.name] = this.sfc.scriptSetup;
            }
            for (const block of this.sfc.styles) {
                blocks[block.name] = block;
            }
            for (const block of this.sfc.customBlocks) {
                blocks[block.name] = block;
            }
            return blocks;
        });
        this._compiledSfcTemplate = (0, reactivity_1.computed)(() => {
            if (this.compiledSFCTemplateCache?.template === this.sfc.template?.content) {
                return {
                    errors: [],
                    warnings: [],
                    ast: this.compiledSFCTemplateCache?.result.ast,
                };
            }
            if (this.sfc.template) {
                // incremental update
                if (this.compiledSFCTemplateCache?.plugin.updateSFCTemplate) {
                    const change = this.snapshot.getChangeRange(this.compiledSFCTemplateCache.snapshot);
                    if (change) {
                        (0, reactivity_1.pauseTracking)();
                        const templateOffset = this.sfc.template.startTagEnd;
                        (0, reactivity_1.resetTracking)();
                        const newText = this.snapshot.getText(change.span.start, change.span.start + change.newLength);
                        const newResult = this.compiledSFCTemplateCache.plugin.updateSFCTemplate(this.compiledSFCTemplateCache.result, {
                            start: change.span.start - templateOffset,
                            end: change.span.start + change.span.length - templateOffset,
                            newText,
                        });
                        if (newResult) {
                            this.compiledSFCTemplateCache.template = this.sfc.template.content;
                            this.compiledSFCTemplateCache.snapshot = this.snapshot;
                            this.compiledSFCTemplateCache.result = newResult;
                            return {
                                errors: [],
                                warnings: [],
                                ast: newResult.ast,
                            };
                        }
                    }
                }
                const errors = [];
                const warnings = [];
                let options = {
                    onError: (err) => errors.push(err),
                    onWarn: (err) => warnings.push(err),
                    expressionPlugins: ['typescript'],
                };
                for (const plugin of this.plugins) {
                    if (plugin.resolveTemplateCompilerOptions) {
                        options = plugin.resolveTemplateCompilerOptions(options);
                    }
                }
                for (const plugin of this.plugins) {
                    let result;
                    try {
                        result = plugin.compileSFCTemplate?.(this.sfc.template.lang, this.sfc.template.content, options);
                    }
                    catch (e) {
                        const err = e;
                        errors.push(err);
                    }
                    if (result || errors.length) {
                        if (result && !errors.length && !warnings.length) {
                            this.compiledSFCTemplateCache = {
                                template: this.sfc.template.content,
                                snapshot: this.snapshot,
                                result: result,
                                plugin,
                            };
                        }
                        else {
                            this.compiledSFCTemplateCache = undefined;
                        }
                        return {
                            errors,
                            warnings,
                            ast: result?.ast,
                        };
                    }
                }
            }
        });
        this._pluginEmbeddedFiles = this.plugins.map((plugin) => {
            const embeddedFiles = {};
            const files = (0, reactivity_1.computed)(() => {
                try {
                    if (plugin.getEmbeddedFileNames) {
                        const embeddedFileNames = plugin.getEmbeddedFileNames(this.fileName, this.sfc);
                        for (const oldFileName of Object.keys(embeddedFiles)) {
                            if (!embeddedFileNames.includes(oldFileName)) {
                                delete embeddedFiles[oldFileName];
                            }
                        }
                        for (const embeddedFileName of embeddedFileNames) {
                            if (!embeddedFiles[embeddedFileName]) {
                                embeddedFiles[embeddedFileName] = (0, reactivity_1.computed)(() => {
                                    const [content, stacks] = this.codegenStack ? muggle.track([]) : [[], []];
                                    const file = new VueEmbeddedFile(embeddedFileName, content, stacks);
                                    for (const plugin of this.plugins) {
                                        if (plugin.resolveEmbeddedFile) {
                                            try {
                                                plugin.resolveEmbeddedFile(this.fileName, this.sfc, file);
                                            }
                                            catch (e) {
                                                console.error(e);
                                            }
                                        }
                                    }
                                    const newText = (0, source_map_1.toString)(file.content);
                                    const changeRanges = new Map();
                                    const snapshot = {
                                        getText: (start, end) => newText.slice(start, end),
                                        getLength: () => newText.length,
                                        getChangeRange(oldSnapshot) {
                                            if (!changeRanges.has(oldSnapshot)) {
                                                changeRanges.set(oldSnapshot, undefined);
                                                const oldText = oldSnapshot.getText(0, oldSnapshot.getLength());
                                                for (let start = 0; start < oldText.length && start < newText.length; start++) {
                                                    if (oldText[start] !== newText[start]) {
                                                        let end = oldText.length;
                                                        for (let i = 0; i < oldText.length - start && i < newText.length - start; i++) {
                                                            if (oldText[oldText.length - i - 1] !== newText[newText.length - i - 1]) {
                                                                break;
                                                            }
                                                            end--;
                                                        }
                                                        let length = end - start;
                                                        let newLength = length + (newText.length - oldText.length);
                                                        if (newLength < 0) {
                                                            length -= newLength;
                                                            newLength = 0;
                                                        }
                                                        changeRanges.set(oldSnapshot, {
                                                            span: { start, length },
                                                            newLength,
                                                        });
                                                        break;
                                                    }
                                                }
                                            }
                                            return changeRanges.get(oldSnapshot);
                                        },
                                    };
                                    return {
                                        file,
                                        snapshot,
                                    };
                                });
                            }
                        }
                    }
                }
                catch (e) {
                    console.error(e);
                }
                return Object.values(embeddedFiles);
            });
            return (0, reactivity_1.computed)(() => {
                return files.value.map(_file => {
                    const file = _file.value.file;
                    const snapshot = _file.value.snapshot;
                    const mappings = (0, source_map_1.buildMappings)(file.content);
                    for (const mapping of mappings) {
                        if (mapping.source !== undefined) {
                            const block = this._sfcBlocks.value[mapping.source];
                            if (block) {
                                mapping.sourceRange = [
                                    mapping.sourceRange[0] + block.startTagEnd,
                                    mapping.sourceRange[1] + block.startTagEnd,
                                ];
                            }
                            else {
                                // ignore
                            }
                            mapping.source = undefined;
                        }
                    }
                    return {
                        file,
                        snapshot,
                        mappings,
                        codegenStacks: (0, source_map_1.buildStacks)(file.content, file.contentStacks),
                    };
                });
            });
        });
        this._allEmbeddedFiles = (0, reactivity_1.computed)(() => {
            const all = [];
            for (const embeddedFiles of this._pluginEmbeddedFiles) {
                for (const embedded of embeddedFiles.value) {
                    all.push(embedded);
                }
            }
            return all;
        });
        this._embeddedFiles = (0, reactivity_1.computed)(() => {
            const embeddedFiles = [];
            let remain = [...this._allEmbeddedFiles.value];
            while (remain.length) {
                const beforeLength = remain.length;
                consumeRemain();
                if (beforeLength === remain.length) {
                    break;
                }
            }
            for (const { file, snapshot, mappings, codegenStacks } of remain) {
                embeddedFiles.push({
                    ...file,
                    snapshot,
                    mappings,
                    codegenStacks,
                    embeddedFiles: [],
                });
                console.error('Unable to resolve embedded: ' + file.parentFileName + ' -> ' + file.fileName);
            }
            return embeddedFiles;
            function consumeRemain() {
                for (let i = remain.length - 1; i >= 0; i--) {
                    const { file, snapshot, mappings, codegenStacks } = remain[i];
                    if (!file.parentFileName) {
                        embeddedFiles.push({
                            ...file,
                            snapshot,
                            mappings,
                            codegenStacks,
                            embeddedFiles: [],
                        });
                        remain.splice(i, 1);
                    }
                    else {
                        const parent = findParentStructure(file.parentFileName, embeddedFiles);
                        if (parent) {
                            parent.embeddedFiles.push({
                                ...file,
                                snapshot,
                                mappings,
                                codegenStacks,
                                embeddedFiles: [],
                            });
                            remain.splice(i, 1);
                        }
                    }
                }
            }
            function findParentStructure(fileName, current) {
                for (const child of current) {
                    if (child.fileName === fileName) {
                        return child;
                    }
                    let parent = findParentStructure(fileName, child.embeddedFiles);
                    if (parent) {
                        return parent;
                    }
                }
            }
        });
        this.onUpdate();
    }
    update(newScriptSnapshot) {
        if (newScriptSnapshot === this.snapshot)
            return;
        this.snapshot = newScriptSnapshot;
        this.onUpdate();
    }
    onUpdate() {
        const parsedSfc = this.parseSfc();
        updateObj(this.sfc, {
            template: parsedSfc?.descriptor.template ? this.parseTemplateBlock(parsedSfc.descriptor.template) : null,
            script: parsedSfc?.descriptor.script ? this.parseScriptBlock(parsedSfc.descriptor.script) : null,
            scriptSetup: parsedSfc?.descriptor.scriptSetup ? this.parseScriptSetupBlock(parsedSfc.descriptor.scriptSetup) : null,
            styles: parsedSfc?.descriptor.styles.map(this.parseStyleBlock.bind(this)) ?? [],
            customBlocks: parsedSfc?.descriptor.customBlocks.map(this.parseCustomBlock.bind(this)) ?? [],
            templateAst: '__IGNORE__',
            scriptAst: '__IGNORE__',
            scriptSetupAst: '__IGNORE__',
        });
        const str = [[this.snapshot.getText(0, this.snapshot.getLength()), undefined, 0, language_core_1.FileRangeCapabilities.full]];
        for (const block of [
            this.sfc.script,
            this.sfc.scriptSetup,
            this.sfc.template,
            ...this.sfc.styles,
            ...this.sfc.customBlocks,
        ]) {
            if (block) {
                muggle.replaceSourceRange(str, undefined, block.startTagEnd, block.endTagStart, [
                    block.content,
                    undefined,
                    block.startTagEnd,
                    {},
                ]);
            }
        }
        this.mappings = str.map((m) => {
            const text = m[0];
            const start = m[2];
            const end = start + text.length;
            return {
                sourceRange: [start, end],
                generatedRange: [start, end],
                data: m[3],
            };
        });
    }
    parseSfc() {
        // incremental update
        if (this.parsedSfcCache?.plugin.updateSFC) {
            const change = this.snapshot.getChangeRange(this.parsedSfcCache.snapshot);
            if (change) {
                const newSfc = this.parsedSfcCache.plugin.updateSFC(this.parsedSfcCache.sfc, {
                    start: change.span.start,
                    end: change.span.start + change.span.length,
                    newText: this.snapshot.getText(change.span.start, change.span.start + change.newLength),
                });
                if (newSfc) {
                    this.parsedSfcCache.snapshot = this.snapshot;
                    this.parsedSfcCache.sfc = newSfc;
                    return newSfc;
                }
            }
        }
        for (const plugin of this.plugins) {
            const sfc = plugin.parseSFC?.(this.fileName, this.snapshot.getText(0, this.snapshot.getLength()));
            if (sfc) {
                if (!sfc.errors.length) {
                    this.parsedSfcCache = {
                        snapshot: this.snapshot,
                        sfc,
                        plugin,
                    };
                }
                return sfc;
            }
        }
    }
    parseTemplateBlock(block) {
        return {
            ...this.parseBlock(block),
            name: 'template',
            lang: block.lang ?? 'html',
        };
    }
    parseScriptBlock(block) {
        return {
            ...this.parseBlock(block),
            name: 'script',
            lang: block.lang ?? 'js',
            src: block.src,
            srcOffset: block.src ? this.snapshot.getText(0, block.loc.start.offset).lastIndexOf(block.src) - block.loc.start.offset : -1,
        };
    }
    parseScriptSetupBlock(block) {
        return {
            ...this.parseBlock(block),
            name: 'scriptSetup',
            lang: block.lang ?? 'js',
            generic: typeof block.attrs.generic === 'string' ? block.attrs.generic : undefined,
            genericOffset: typeof block.attrs.generic === 'string' ? this.snapshot.getText(0, block.loc.start.offset).lastIndexOf(block.attrs.generic) - block.loc.start.offset : -1,
        };
    }
    parseStyleBlock(block, i) {
        const setting = this.vueCompilerOptions.experimentalResolveStyleCssClasses;
        const shouldParseClassNames = block.module || (setting === 'scoped' && block.scoped) || setting === 'always';
        return {
            ...this.parseBlock(block),
            name: 'style_' + i,
            lang: block.lang ?? 'css',
            module: typeof block.module === 'string' ? block.module : block.module ? '$style' : undefined,
            scoped: !!block.scoped,
            cssVars: [...(0, parseCssVars_1.parseCssVars)(block.content)],
            classNames: shouldParseClassNames ? [...(0, parseCssClassNames_1.parseCssClassNames)(block.content)] : [],
        };
    }
    parseCustomBlock(block, i) {
        return {
            ...this.parseBlock(block),
            name: 'customBlock_' + i,
            lang: block.lang ?? 'txt',
            type: block.type,
        };
    }
    parseBlock(block) {
        return {
            start: this.snapshot.getText(0, block.loc.start.offset).lastIndexOf('<' + block.type),
            end: block.loc.end.offset + this.snapshot.getText(block.loc.end.offset, this.snapshot.getLength()).indexOf('>') + 1,
            startTagEnd: block.loc.start.offset,
            endTagStart: block.loc.end.offset,
            content: block.content,
            attrs: block.attrs,
        };
    }
}
exports.VueFile = VueFile;
function updateObj(oldObj, newObj) {
    if (Array.isArray(oldObj) && Array.isArray(newObj)) {
        for (let i = 0; i < newObj.length; i++) {
            if (oldObj.length > i) {
                updateObj(oldObj[i], newObj[i]);
            }
            else {
                oldObj.push(newObj[i]);
            }
        }
        if (oldObj.length > newObj.length) {
            oldObj.splice(newObj.length, oldObj.length - newObj.length);
        }
    }
    else {
        for (const key in newObj) {
            if (newObj[key] === '__IGNORE__') {
                continue;
            }
            else if (oldObj[key] !== null && newObj[key] !== null && typeof oldObj[key] === 'object' && typeof newObj[key] === 'object') {
                updateObj(oldObj[key], newObj[key]);
            }
            else {
                oldObj[key] = newObj[key];
            }
        }
        for (const key in oldObj) {
            if (!(key in newObj)) {
                delete oldObj[key];
            }
        }
    }
}
//# sourceMappingURL=sourceFile.js.map