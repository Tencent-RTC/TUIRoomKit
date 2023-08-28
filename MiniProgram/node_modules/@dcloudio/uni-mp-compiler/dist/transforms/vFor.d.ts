import { ExpressionNode, SimpleExpressionNode, ElementTypes, ElementNode } from '@vue/compiler-core';
import { NodeTransform, TransformContext } from '../transform';
import { Expression, Identifier, Pattern, RestElement } from '@babel/types';
import { CodegenScope, CodegenVForScope } from '../options';
export type VForOptions = Omit<ForParseResult, 'tagType'> & {
    sourceExpr?: Expression;
    sourceAlias: string;
    sourceCode: string;
    valueCode: string;
    valueExpr: Identifier | Pattern | RestElement;
    valueAlias: string;
    keyCode: string;
    keyExpr: Identifier | Pattern | RestElement;
    keyAlias: string;
    indexCode: string;
    indexExpr: Identifier | Pattern | RestElement;
    indexAlias: string;
    node: ElementNode;
};
export type ForElementNode = ElementNode & {
    vFor: VForOptions & {
        source: ExpressionNode;
    };
};
export declare function isForElementNode(node: unknown): node is ForElementNode;
export declare const transformFor: NodeTransform;
export declare function parseVForScope(currentScope: CodegenScope): CodegenVForScope | undefined;
export interface ForParseResult {
    source: ExpressionNode;
    value: ExpressionNode;
    key: ExpressionNode;
    index: ExpressionNode;
    tagType: ElementTypes;
}
export declare function parseForExpression(input: SimpleExpressionNode, context: TransformContext): ForParseResult | undefined;
export declare function createForLoopParams({ value, key, index }: ForParseResult, memoArgs?: ExpressionNode[]): ExpressionNode[];
export declare function createVForArrowFunctionExpression({ valueExpr, keyExpr, indexExpr, properties, }: CodegenVForScope): import("@babel/types").ArrowFunctionExpression;
