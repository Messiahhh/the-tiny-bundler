#!/usr/bin/env node
import fs from 'fs/promises';
import { bundler } from './libs/bundler';
import { Command } from 'commander';
import path from 'path';

const program = new Command()
  .version('0.1')
  .name('tiny bundler')
  .option('--config <value>', 'config file', 'bundler.config.js')
  .parse(process.argv);
const options = program.opts();

(async function () {
  let CONFIG = {
    entry: 'example/index.js',
    output: 'dist/index.js',
  };

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
