import { ElementNode, TemplateLiteral, Property } from '@vue/compiler-core';
import { NodeTransform, TransformContext } from '../transform';
export interface DirectiveTransformResult {
    props: Property[];
    needRuntime?: boolean | symbol;
    ssrTagParts?: TemplateLiteral['elements'];
}
export declare const transformElement: NodeTransform;
export declare function processProps(node: ElementNode, context: TransformContext, props?: ElementNode['props']): void;
