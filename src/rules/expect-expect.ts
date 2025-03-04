import { Rule } from 'eslint';
import * as ESTree from 'estree';
import { isExpectCall, isIdentifier, isTest } from '../utils/ast';
import { getAdditionalAssertFunctionNames } from '../utils/misc';

function isAssertionCall(
  node: ESTree.CallExpression,
  additionalAssertFunctionNames: string[],
) {
  return (
    isExpectCall(node) ||
    additionalAssertFunctionNames.find((name) =>
      isIdentifier(node.callee, name),
    )
  );
}

export default {
  create(context) {
    const unchecked: ESTree.CallExpression[] = [];
    const additionalAssertFunctionNames =
      getAdditionalAssertFunctionNames(context);

    function checkExpressions(nodes: ESTree.Node[]) {
      for (const node of nodes) {
        const index =
          node.type === 'CallExpression' ? unchecked.indexOf(node) : -1;

        if (index !== -1) {
          unchecked.splice(index, 1);
          break;
        }
      }
    }

    return {
      CallExpression(node) {
        if (isTest(node, ['fixme', 'only', 'skip'])) {
          unchecked.push(node);
        } else if (isAssertionCall(node, additionalAssertFunctionNames)) {
          checkExpressions(context.getAncestors());
        }
      },
      'Program:exit'() {
        unchecked.forEach((node) => {
          context.report({ messageId: 'noAssertions', node });
        });
      },
    };
  },
  meta: {
    docs: {
      category: 'Best Practices',
      description: 'Enforce assertion to be made in a test body',
      recommended: true,
      url: 'https://github.com/playwright-community/eslint-plugin-playwright/tree/main/docs/rules/expect-expect.md',
    },
    messages: {
      noAssertions: 'Test has no assertions',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          additionalAssertFunctionNames: {
            items: [{ type: 'string' }],
            type: 'array',
          },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
} as Rule.RuleModule;
