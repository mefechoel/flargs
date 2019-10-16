import { IsArrayElse } from '../util/types';
import { createConfigurator, bindFactory } from './builder';
import builderFns, { InputTypes, InputValueType } from './builderFns';

export const flagBuilderSymbol = Symbol('FlagBuilder');

export interface FlagConf<T = InputValueType> {
  name?: string;
  shorthand?: string;
  description?: string;
  required?: boolean;
  array?: boolean;
  type?: InputTypes;
  defaultValue?: T;
}

export interface DefaultFlagConf<T = InputValueType>
  extends FlagConf<T> {
  required: boolean;
  array: boolean;
  type: InputTypes;
}

export interface BuiltFlagConf<T = InputValueType>
  extends DefaultFlagConf<T> {
  name: string;
}

const defaultFlagConf: DefaultFlagConf<InputValueType> = {
  required: false,
  array: false,
  type: InputTypes.String,
};

export interface FlagBuilder<T = string> {
  name: (name: string) => FlagBuilder<T>;
  shorthand: (shorthand: string) => FlagBuilder<T>;
  description: (description: string) => FlagBuilder<T>;
  required: () => FlagBuilder<T>;
  number: () => FlagBuilder<IsArrayElse<T, number[], number>>;
  boolean: () => FlagBuilder<IsArrayElse<T, boolean[], boolean>>;
  string: () => FlagBuilder<IsArrayElse<T, string[], string>>;
  array: () => FlagBuilder<IsArrayElse<T, T, T[]>>;
  default: (value: T) => FlagBuilder<T>;
  _build: () => BuiltFlagConf<T>;
  [flagBuilderSymbol]: boolean;
}

function createConfigBuilder<T>() {
  return {
    name: builderFns.name,
    shorthand: builderFns.shorthand,
    description: builderFns.description,
    required: builderFns.required,
    number: builderFns.number,
    boolean: builderFns.boolean,
    string: builderFns.string,
    array: builderFns.array,
    default: builderFns.createDefault<T>(),
  };
}

function createFlagBuilder<T = string>(
  conf: FlagConf<T> = {},
): FlagBuilder<T> {
  const configure = createConfigurator(conf);
  const configBuilder = createConfigBuilder();
  const boundBuilderFns = bindFactory(createFlagBuilder, configure)(
    configBuilder,
  );
  const _build = () => {
    if (!conf.name) {
      throw new Error(
        'The "name" attribute is required for a flag, ' +
          'but no name was specified. ' +
          'You can set a name by calling .name() on the flag builder.',
      );
    }
    const builtConf = {
      ...defaultFlagConf,
      ...conf,
    };
    return builtConf as BuiltFlagConf<T>;
  };
  const builder = {
    ...boundBuilderFns,
    _build,
    [flagBuilderSymbol]: true,
  };
  return builder as FlagBuilder<T>;
}

export default createFlagBuilder;
