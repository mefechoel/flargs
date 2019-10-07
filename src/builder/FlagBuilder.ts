import { IsArrayElse } from '../util/types';

export const flagBuilderSymbol = Symbol('FlagBuilder');

type ValueType = number | string | boolean;
type ValueArrayType = number[] | string[] | boolean[];

enum FlagTypes {
  Number = 'number',
  String = 'string',
  Boolean = 'boolean',
}

export type FlagValueType = ValueType | ValueArrayType;

export interface FlagConf<T = FlagValueType> {
  name?: string;
  shorthand?: string;
  description?: string;
  required?: boolean;
  array?: boolean;
  type?: FlagTypes;
  defaultValue?: T;
}

export interface DefaultFlagConf<T = FlagValueType>
  extends FlagConf<T> {
  required: boolean;
  array: boolean;
  type: FlagTypes;
}

export interface BuiltFlagConf<T = FlagValueType>
  extends DefaultFlagConf<T> {
  name: string;
}

const defaultFlagConf: DefaultFlagConf = {
  required: false,
  array: false,
  type: FlagTypes.String,
};

class FlagBuilder<T = string> {
  [flagBuilderSymbol] = true;

  private _conf: FlagConf<T>;

  constructor(conf: FlagConf<T> = {}) {
    this._conf = conf;
  }

  name(name: string): FlagBuilder<T> {
    return this._configure({ name });
  }

  shorthand(shorthand: string): FlagBuilder<T> {
    return this._configure({ shorthand });
  }

  description(description: string): FlagBuilder<T> {
    return this._configure({ description });
  }

  required(): FlagBuilder<T> {
    return this._configure({ required: true });
  }

  number(): FlagBuilder<IsArrayElse<T, number[], number>> {
    type R = IsArrayElse<T, number[], number>;
    return this._configure<R>({
      type: FlagTypes.Number,
    });
  }

  boolean(): FlagBuilder<IsArrayElse<T, boolean[], boolean>> {
    type R = IsArrayElse<T, boolean[], boolean>;
    return this._configure<R>({
      type: FlagTypes.Boolean,
    });
  }

  string(): FlagBuilder<IsArrayElse<T, string[], string>> {
    type R = IsArrayElse<T, string[], string>;
    return this._configure<R>({
      type: FlagTypes.String,
    });
  }

  array(): FlagBuilder<IsArrayElse<T, T, T[]>> {
    type R = IsArrayElse<T, T, T[]>;
    return this._configure<R>({
      array: true,
    });
  }

  default(value: T): FlagBuilder<T> {
    return this._configure({ defaultValue: value });
  }

  private _configure<BuilderValueType = T>(
    config: Partial<FlagConf<BuilderValueType>>,
  ): FlagBuilder<BuilderValueType> {
    return new FlagBuilder<BuilderValueType>({
      ...((this._conf as unknown) as FlagConf<BuilderValueType>),
      ...config,
    });
  }

  _build(): BuiltFlagConf<T> {
    if (!this._conf.name) {
      throw new Error(
        'The "name" attribute is required for a flag, ' +
          'but no name was specified. ' +
          'You can set a name by calling .name() on the flag builder.',
      );
    }
    const builtConf = {
      ...defaultFlagConf,
      ...this._conf,
    };
    return builtConf as BuiltFlagConf<T>;
  }
}

export default FlagBuilder;
