#!/usr/bin/env node
import fs from 'fs/promises';
import { Command } from 'commander';
import path from 'path';
import { IConfig } from '../types';
import { Compiler } from '../lib';

const program = new Command()
  .version('0.1')
  .name('tiny bundler')
  .option('--config <value>', 'config file', 'bundler.config.js')
  .parse(process.argv);
const options = program.opts();

(async function () {
  try {
    const config = await readConfig(path.join(process.cwd(), options.config));
    const output = await (await new Compiler(config).build()).generate();
    await fs.writeFile(config.output, output);
  } catch (error) {
    console.log(error);
  }
})();

async function readConfig(path: string) {
  const defaultConfig: IConfig = {
    entry: 'example/index.js',
    output: 'dist/index.js',
    extensions: ['.js', '.ts'],
    loaders: [],
  };
  try {
    const file = await fs.readFile(path, 'utf-8');
    const module = {
      exports: {},
    };
    eval(file);

    return Object.assign({} as IConfig, defaultConfig, module.exports);
  } catch (error) {
    return defaultConfig;
  }
}
