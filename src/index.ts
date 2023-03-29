#!/usr/bin/env node
import fs from 'fs/promises';
import { Command } from 'commander';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { transformFromAstAsync } from '@babel/core';

const program = new Command()
  .version('0.1')
  .name('tiny bundler')
  .option('--config <value>', 'config file', 'bundler.config.js')
  .parse(process.argv);
const options = program.opts();

let CONFIG = {
  entry: 'example/index.js',
  output: 'dist/index.js',
  resolve: {
    extensions: ['.js', '.ts'],
  },
};

(async function () {
  try {
    const file = await fs.readFile(path.join(process.cwd(), options.config), 'utf-8');
    const module = {
      exports: {},
    };
    eval(file);

    CONFIG = Object.assign({} as any, CONFIG, module.exports);
  } catch (error) {
    /* empty */
  }

  async function main() {
    try {
      const filename = CONFIG.entry;
      const result = await bundler(filename);
      await fs.writeFile(CONFIG.output, result);
    } catch (error) {
      console.log(error);
    }
  }
  main();
})();

export async function bundler(entry: string) {
  const graph = await makeModuleGraph(entry);
  return `
    (function(graph) {
        const module_cache = {};
        function executor(entry) {
            let module = {
                exports: {}
            }
            function require(relativePath) {
                const absolutePath = graph[entry].dependencies[relativePath]
                const cacheModule = module_cache[absolutePath]
                if (cacheModule !== undefined) {
                    return cacheModule.exports;
                }

                let result = executor(absolutePath)
                module_cache[absolutePath] = {
                    exports: result
                }

                return result;
            }

            (function(module, exports, require) {
                eval(graph[entry].code)
            })(module, module.exports, require)
            
            return module.exports
        }   
        executor("${entry}") 
    })(${JSON.stringify(graph)})
  `;
}

export async function makeModuleGraph(filename: string, graph: Record<string, any> = {}) {
  const result = await parseModule(filename);
  const { code, dependencies } = result;
  graph[filename] = {
    code,
    dependencies,
  };
  await Promise.all(
    Object.values(dependencies).map(async filename => {
      await makeModuleGraph(filename, graph);
    })
  );

  return graph;
}

export async function parseModule(filename: string): Promise<{
  filename: string;
  code: string;
  dependencies: Record<string, string>;
}> {
  const dependencies: Record<string, string> = {};
  const ext = filename.match(/\.\w+$/)?.[0];

  if (ext) {
    switch (ext) {
      case '.js': {
        return await parseJsModule(filename);
      }

      case '.txt':
      case '.md': {
        const text = await fs.readFile(filename, { encoding: 'utf-8' });
        return {
          filename,
          code: `
            module.exports = ${JSON.stringify(text)}
          `,
          dependencies,
        };
      }

      default: {
        throw new Error('extension not supported');
      }
    }
  } else {
    const result = await ['.js', '.ts', '.jsx'].reduce(async (result, ext) => {
      if (!result) {
        try {
          return await parseJsModule(filename + ext);
        } catch {
          return;
        }
      }

      return result;
    }, null as null | any);
    if (!result) {
      throw new Error('extension not found');
    }
    return result;
  }
}

async function parseJsModule(filename: string): Promise<{
  filename: string;
  code: string;
  dependencies: Record<string, string>;
}> {
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
    code: code!,
  };
}
