import createFlagBuilder, { FlagBuilder } from './flagBuilder';
import createParamBuilder, { ParamBuilder } from './paramBuilder';
import createCommandBuilder, {
  CommandBuilder,
} from './commandBuilder';

type Builder = FlagBuilder | ParamBuilder | CommandBuilder;

type BuilderFactory<T> = (name?: string) => T;

interface Flargs {
  (name?: string): CommandBuilder;
  flag: BuilderFactory<FlagBuilder>;
  param: BuilderFactory<ParamBuilder>;
  command: BuilderFactory<CommandBuilder>;
}

function createBuilderFactory<
  T extends { name: (name: string) => T }
>(builderFactory: () => T): (name?: string) => T {
  return function builderFn(name?: string): T {
    if (name && typeof name !== 'string') {
      throw new TypeError(
        'Expected either a string as "name" param or no param, ' +
          `but recieved: ${String(name)}`,
      );
    }
    const builder = builderFactory();
    if (name) {
      return builder.name(name);
    }
    return builder;
  };
}

export const flag = createBuilderFactory(createFlagBuilder);

export const param = createBuilderFactory(createParamBuilder);

export const command = createBuilderFactory(createCommandBuilder);

const flargsFn = createBuilderFactory(createCommandBuilder);

(flargsFn as Flargs).flag = flag;
(flargsFn as Flargs).param = param;
(flargsFn as Flargs).command = command;

const flargs: Flargs = flargsFn as Flargs;

export default flargs;
