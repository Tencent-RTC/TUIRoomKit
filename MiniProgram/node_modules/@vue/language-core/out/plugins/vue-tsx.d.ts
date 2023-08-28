import { Sfc, VueLanguagePlugin } from '../types';
import * as muggle from 'muggle-string';
export declare const tsCodegen: WeakMap<Sfc, {
    scriptRanges: import("@vue/reactivity").ComputedRef<{
        exportDefault: (import("../types").TextRange & {
            expression: import("../types").TextRange;
            args: import("../types").TextRange;
            argsNode: import("typescript/lib/tsserverlibrary").ObjectLiteralExpression | undefined;
            componentsOption: import("../types").TextRange | undefined;
            componentsOptionNode: import("typescript/lib/tsserverlibrary").ObjectLiteralExpression | undefined;
            nameOption: import("../types").TextRange | undefined;
        }) | undefined;
        bindings: import("../types").TextRange[];
    } | undefined>;
    scriptSetupRanges: import("@vue/reactivity").ComputedRef<{
        leadingCommentEndOffset: number;
        importSectionEndOffset: number;
        bindings: import("../types").TextRange[];
        withDefaultsArg: import("../types").TextRange | undefined;
        defineProps: import("../types").TextRange | undefined;
        propsAssignName: string | undefined;
        propsRuntimeArg: import("../types").TextRange | undefined;
        propsTypeArg: import("../types").TextRange | undefined;
        slotsTypeArg: import("../types").TextRange | undefined;
        emitsAssignName: string | undefined;
        emitsRuntimeArg: import("../types").TextRange | undefined;
        emitsTypeArg: import("../types").TextRange | undefined;
        emitsTypeNums: number;
        exposeRuntimeArg: import("../types").TextRange | undefined;
        defineProp: {
            name: import("../types").TextRange | undefined;
            nameIsString: boolean;
            type: import("../types").TextRange | undefined;
            defaultValue: import("../types").TextRange | undefined;
            required: boolean;
        }[];
    } | undefined>;
    lang: import("@vue/reactivity").ComputedRef<string>;
    tsxGen: import("@vue/reactivity").ComputedRef<{
        codes: muggle.Segment<import("@volar/language-core").FileRangeCapabilities>[];
        codeStacks: muggle.StackNode[];
        mirrorBehaviorMappings: import("@volar/source-map").Mapping<[import("@volar/language-core").MirrorBehaviorCapabilities, import("@volar/language-core").MirrorBehaviorCapabilities]>[];
    }>;
    htmlGen: import("@vue/reactivity").ComputedRef<{
        codes: (string | [string, string | undefined, number | [number, number], import("@volar/language-core").FileRangeCapabilities])[];
        codeStacks: muggle.StackNode[];
        formatCodes: (string | [string, string | undefined, number | [number, number], import("@volar/language-core").FileRangeCapabilities])[];
        formatCodeStacks: muggle.StackNode[];
        cssCodes: (string | [string, string | undefined, number | [number, number], import("@volar/language-core").FileRangeCapabilities])[];
        cssCodeStacks: muggle.StackNode[];
        tagNames: Record<string, number[]>;
        identifiers: Set<string>;
        hasSlot: boolean;
    } | undefined>;
}>;
declare const plugin: VueLanguagePlugin;
export default plugin;
