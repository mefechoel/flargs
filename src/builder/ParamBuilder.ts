import { IsArrayElse } from '../util/types';

export const paramBuilderSymbol = Symbol('ParamBuilder');

type ValueType = number | string;
type ValueArrayType = number[] | string[];

enum ParamTypes {
  Number = 'number',
  String = 'string',
}

export type ParamValueType = ValueType | ValueArrayType;

export interface ParamConf<T = ParamValueType> {
  name?: string;
  required?: boolean;
  array?: boolean;
  type?: ParamTypes;
  defaultValue?: T;
}

export interface DefaultParamConf<T = ParamValueType>
  extends ParamConf<T> {
  required: boolean;
  array: boolean;
  type: ParamTypes;
}

export interface BuiltParamConf<T = ParamValueType>
  extends DefaultParamConf<T> {
  name: string;
}

const defaultParamConf: DefaultParamConf = {
  required: false,
  array: false,
  type: ParamTypes.String,
};

class ParamBuilder<T = string> {
  [paramBuilderSymbol] = true;

  private _conf: ParamConf<T>;

  constructor(conf: ParamConf<T> = {}) {
    this._conf = conf;
  }

  name(name: string): ParamBuilder<T> {
    return this._configure({ name });
  }

  required(): ParamBuilder<T> {
    return this._configure({ required: true });
  }

  number(): ParamBuilder<IsArrayElse<T, number[], number>> {
    type R = IsArrayElse<T, number[], number>;
    return this._configure<R>({
      type: ParamTypes.Number,
    });
  }

  string(): ParamBuilder<IsArrayElse<T, string[], string>> {
    type R = IsArrayElse<T, string[], string>;
    return this._configure<R>({
      type: ParamTypes.String,
    });
  }

  array(): ParamBuilder<IsArrayElse<T, T, T[]>> {
    type R = IsArrayElse<T, T, T[]>;
    return this._configure<R>({
      array: true,
    });
  }

  default(value: T): ParamBuilder<T> {
    return this._configure({ defaultValue: value });
  }

  private _configure<BuilderValueType = T>(
    config: Partial<ParamConf<BuilderValueType>>,
  ): ParamBuilder<BuilderValueType> {
    return new ParamBuilder<BuilderValueType>({
      ...((this._conf as unknown) as ParamConf<BuilderValueType>),
      ...config,
    });
  }

  _build(): BuiltParamConf<T> {
    if (!this._conf.name) {
      throw new Error(
        'The "name" attribute is required for a param, ' +
          'but no name was specified. ' +
          'You can set a name by calling .name() on the param builder.',
      );
    }
    const builtConf = {
      ...defaultParamConf,
      ...this._conf,
    };
    return builtConf as BuiltParamConf<T>;
  }
}

export default ParamBuilder;
