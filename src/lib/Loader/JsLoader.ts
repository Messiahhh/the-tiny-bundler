import fs from 'fs/promises';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { transformFromAstAsync } from '@babel/core';

export async function JsLoader(id: string): Promise<{
  id: string;
  code: string;
  dependencies: Record<string, string>;
}> {
  const dependencies: Record<string, string> = {};
  const oldCode = await fs.readFile(id, { encoding: 'utf-8' });

  const ast = parse(oldCode, {
    sourceType: 'module',
    plugins: ['typescript'],
  });
  traverse(ast, {
    ImportDeclaration({ node }) {
      const dirname = path.dirname(id);
      const newFilename = `${path.join(dirname, node.source.value)}`; // onResolve
      dependencies[node.source.value] = newFilename;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { code } = (await transformFromAstAsync(ast, undefined, {
    presets: ['@babel/preset-env'],
  }))!;

  return {
    id,
    dependencies,
    code: code!,
  };
}
