import { fromEntries, entries } from '../util/object';

type NextConf<ConfType> = (
  prevConfig: Partial<ConfType>,
) => Partial<ConfType>;

export type ConfigureFn<ConfIn, ConfOut = ConfIn> = (
  config: Partial<ConfIn> | NextConf<ConfIn>,
) => ConfOut;

export interface ConfigBuilder<ConfType> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: (...args: any[]) => { [k in keyof ConfType]: any };
}

export function createConfigurator<ConfIn, ConfOut = ConfIn>(
  baseConfig: ConfIn,
): ConfigureFn<ConfIn, ConfOut> {
  const configure: ConfigureFn<ConfIn, ConfOut> = config => {
    const nextValue =
      typeof config === 'function' ? config(baseConfig) : config;
    const nextConfig = {
      ...baseConfig,
      ...nextValue,
    };
    return (nextConfig as unknown) as ConfOut;
  };
  return configure;
}

export function bindFactory<ConfType, Builder>(
  factory: (conf: ConfType) => Builder,
  configure: ConfigureFn<ConfType>,
) {
  return (
    configBuilder: ConfigBuilder<ConfType>,
  ): Partial<Builder> => {
    const boundEntries: [
      string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (...args: any[]) => Builder,
    ][] = entries(configBuilder).map(([key, fn]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const boundFn = (...args: any[]) => {
        const nextValue = fn(...args);
        const nextConfig = configure(nextValue);
        return factory(nextConfig);
      };
      return [key, boundFn];
    });
    return (fromEntries(boundEntries) as unknown) as Partial<Builder>;
  };
}
