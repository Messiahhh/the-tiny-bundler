import { makeGraph } from './makeGraph';

export async function bundler(entry: string) {
  const graph = await makeGraph(entry);
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
