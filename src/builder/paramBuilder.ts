import { IsArrayElse } from '../util/types';
import { createConfigurator, bindFactory } from './builder';
import builderFns, { InputTypes } from './builderFns';

export const paramBuilderSymbol = Symbol('ParamBuilder');

type ValueType = number | string;
type ValueArrayType = number[] | string[];

export type ParamValueType = ValueType | ValueArrayType;

export interface ParamConf<T = ParamValueType> {
  name?: string;
  description?: string;
  required?: boolean;
  array?: boolean;
  type?: InputTypes;
  defaultValue?: T;
}

export interface DefaultParamConf<T = ParamValueType>
  extends ParamConf<T> {
  required: boolean;
  array: boolean;
  type: InputTypes;
}

export interface BuiltParamConf<T = ParamValueType>
  extends DefaultParamConf<T> {
  name: string;
}

const defaultParamConf: DefaultParamConf = {
  required: false,
  array: false,
  type: InputTypes.String,
};

export interface ParamBuilder<T = string> {
  name: (name: string) => ParamBuilder<T>;
  description: (description: string) => ParamBuilder<T>;
  required: () => ParamBuilder<T>;
  number: () => ParamBuilder<IsArrayElse<T, number[], number>>;
  string: () => ParamBuilder<IsArrayElse<T, string[], string>>;
  array: () => ParamBuilder<IsArrayElse<T, T, T[]>>;
  default: (value: T) => ParamBuilder<T>;
  _build: () => BuiltParamConf<T>;
  [paramBuilderSymbol]: boolean;
}

function createConfigBuilder<T>() {
  return {
    name: builderFns.name,
    description: builderFns.description,
    required: builderFns.required,
    number: builderFns.number,
    string: builderFns.string,
    array: builderFns.array,
    default: builderFns.createDefault<T>(),
  };
}

function createParamBuilder<T = string>(
  conf: ParamConf<T> = {},
): ParamBuilder<T> {
  const configure = createConfigurator(conf);
  const configBuilder = createConfigBuilder();
  const boundBuilderFns = bindFactory(createParamBuilder, configure)(
    configBuilder,
  );
  const _build = () => {
    if (!conf.name) {
      throw new Error(
        'The "name" attribute is required for a param, ' +
          'but no name was specified. ' +
          'You can set a name by calling .name() on the param builder.',
      );
    }
    const builtConf = {
      ...defaultParamConf,
      ...conf,
    };
    return builtConf as BuiltParamConf<T>;
  };
  const builder = {
    ...boundBuilderFns,
    _build,
    [paramBuilderSymbol]: true,
  };
  return builder as ParamBuilder<T>;
}

export default createParamBuilder;
