import path from 'path';
import { IConfig } from '../types';
import { ModuleGraph } from './Module/ModuleGraph';

export class Compiler {
  config: IConfig;
  moduleGraph?: ModuleGraph;

  constructor(config: IConfig) {
    this.config = config;
  }

  async build(): Promise<this> {
    const id = path.join(process.cwd(), this.config.entry);
    this.moduleGraph = await new ModuleGraph(this.config).addModule(id);
    return this;
  }

  async generate(): Promise<string> {
    const id = path.join(process.cwd(), this.config.entry);
    return `(function(graph) {
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
      executor("${id}") 
    })(${JSON.stringify(Object.fromEntries(this.moduleGraph!.graph.entries()))})`;
  }
}
