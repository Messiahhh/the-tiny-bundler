import fs from 'fs/promises';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { transformFromAstAsync } from '@babel/core';

export async function parseModule(filename: string) {
  const dependencies: Record<string, string> = {};
  const oldCode = await fs.readFile(filename, { encoding: 'utf-8' });
  const ast = await parse(oldCode, {
    sourceType: 'module',
  });
  traverse(ast, {
    ImportDeclaration({ node }) {
      const dirname = path.dirname(filename);
      const newFilename = `./${path.join(dirname, node.source.value)}`;
      dependencies[node.source.value] = newFilename;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { code } = (await transformFromAstAsync(ast, undefined, {
    presets: ['@babel/preset-env'],
  }))!;

  return {
    filename,
    dependencies,
    code,
  };
}
