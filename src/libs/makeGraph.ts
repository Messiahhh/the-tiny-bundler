import { parseModule } from './parseModule';

export async function makeGraph(filename: string, graph: Record<string, any> = {}) {
  const { code, dependencies } = await parseModule(filename);
  graph[filename] = {
    code,
    dependencies,
  };
  await Promise.all(
    Object.values(dependencies).map(async filename => {
      await makeGraph(filename, graph);
    })
  );

  return graph;
}
