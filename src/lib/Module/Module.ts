import { IConfig, IFile } from '../../types';
import { JsLoader } from '../Loader/JsLoader';
import { TextLoader } from '../Loader/TextLoader';

export class Module {
  static Cache: Map<string, Module> = new Map();

  id: string;
  code = '';
  dependencies: Record<string, string> = {};

  config: IConfig;

  constructor(id: IFile['id'], config: IConfig) {
    this.id = id;
    this.config = config;
  }

  async init(): Promise<Module> {
    if (Module.Cache.has(this.id)) {
      return Module.Cache.get(this.id)!;
    }
    Module.Cache.set(this.id, this);

    const name = this.id.split('/').pop()!;
    const ext = name.match(/\.\w+$/)?.[0];

    /**
     * external loaders
     */
    for (const { test: regexp, use: loader } of this.config.loaders) {
      if (regexp.test(name)) {
        const { code, dependencies = {} } = await loader(this.id);
        this.code = code;
        this.dependencies = dependencies;
        return this;
      }
      continue;
    }

    /**
     * build-in loaders
     */
    if (ext) {
      switch (ext) {
        case '.ts':
        case '.js': {
          const { code, dependencies } = await JsLoader(this.id);
          this.code = code;
          this.dependencies = dependencies;
          break;
        }

        case '.txt':
        case '.md': {
          const { code } = await TextLoader(this.id);

          this.code = code;
          break;
        }

        default: {
          throw new Error('extension not supported');
        }
      }
    } else {
      const result = await this.config.extensions.reduce(async (result, ext) => {
        if (!result) {
          try {
            return await JsLoader(this.id + ext);
          } catch {
            return;
          }
        }

        return result;
      }, null as null | any);
      if (!result) {
        throw new Error('extension not found');
      }
      const { code, dependencies } = result;
      this.code = code;
      this.dependencies = dependencies;
    }

    return this;
  }
}
