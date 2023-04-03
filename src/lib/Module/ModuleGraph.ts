import { IConfig } from '../../types';
import { Module } from './Module';

export class ModuleGraph {
  config: IConfig;
  graph: Map<
    string,
    {
      code: string;
      dependencies: Record<string, string>;
    }
  > = new Map();

  constructor(config: IConfig) {
    this.config = config;
  }

  async addModule(id: string): Promise<this> {
    const module = await new Module(id, this.config).init();
    const { code, dependencies } = module;
    this.graph.set(module.id, {
      code,
      dependencies,
    });

    await Promise.all(
      Object.values(dependencies).map(async id => {
        await this.addModule(id);
      })
    );

    return this;
  }
}
