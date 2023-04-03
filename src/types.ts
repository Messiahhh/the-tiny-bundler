// 在Webpack配置的基础上进行简化
export interface IConfig {
  entry: string;
  output: string;
  extensions: `.${string}`[];
  loaders: {
    test: RegExp;
    use: ILoader; // 暂不支持数组
  }[];
}

export type ILoader = (id: string) => Promise<{ code: string; dependencies?: Record<string, string> }>;

export interface IFile {
  source: string;
  id: string;
}
