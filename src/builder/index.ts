import FlagBuilder from './FlagBuilder';
import ParamBuilder from './ParamBuilder';
import CommandBuilder from './CommandBuilder';

type Builder = FlagBuilder | ParamBuilder | CommandBuilder;

type BuilderFactory<T> = (name?: string) => T;

interface Flargs {
  (name?: string): CommandBuilder;
  flag: BuilderFactory<FlagBuilder>;
  param: BuilderFactory<ParamBuilder>;
  command: BuilderFactory<CommandBuilder>;
}

function createBuilderFactory(BuilderClass: {
  new (): Builder;
}): (name?: string) => Builder {
  return function builderFn(name?: string): Builder {
    if (name && typeof name !== 'string') {
      throw new TypeError(
        'Expected either a string as "name" param or no param, ' +
          `but recieved: ${String(name)}`,
      );
    }
    const builder = new BuilderClass();
    if (name) {
      return builder.name(name);
    }
    return builder;
  };
}

export const flag = createBuilderFactory(
  FlagBuilder,
) as BuilderFactory<FlagBuilder>;

export const param = createBuilderFactory(
  ParamBuilder,
) as BuilderFactory<ParamBuilder>;

export const command = createBuilderFactory(
  CommandBuilder,
) as BuilderFactory<CommandBuilder>;

const flargsFn = createBuilderFactory(
  CommandBuilder,
) as BuilderFactory<CommandBuilder>;

(flargsFn as Flargs).flag = flag;
(flargsFn as Flargs).param = param;
(flargsFn as Flargs).command = command;

const flargs: Flargs = flargsFn as Flargs;

export default flargs;
