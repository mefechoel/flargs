/* eslint-disable class-methods-use-this */
type ValueType = number | string | boolean;
type ValueArrayType = number[] | string[] | boolean[];

enum FlagTypes {
  Number,
  String,
  Boolean,
}

type FlagValueType = ValueType | ValueArrayType;

interface FlagConf<T = FlagValueType> {
  name?: string;
  shorthand?: string;
  required?: boolean;
  array?: boolean;
  type?: FlagTypes;
  defaultValue?: T;
}

interface DefaultFlagConf<T = FlagValueType> extends FlagConf<T> {
  required: boolean;
  array: boolean;
  type: FlagTypes;
}

interface BuiltFlagConf<T = FlagValueType>
  extends DefaultFlagConf<T> {
  name: string;
}

const defaultFlagConf: DefaultFlagConf = {
  required: false,
  array: false,
  type: FlagTypes.String,
};

class FlagBuilder<T = string> {
  conf: FlagConf<T>;

  constructor(conf: FlagConf<T> = {}) {
    this.conf = conf;
  }

  // eslint-disable-next-line no-shadow
  name(name: string): FlagBuilder<T> {
    return new FlagBuilder({ ...this.conf, name });
  }

  // eslint-disable-next-line no-shadow
  shorthand(shorthand: string): FlagBuilder<T> {
    return new FlagBuilder({ ...this.conf, shorthand });
  }

  required(): FlagBuilder<T> {
    return new FlagBuilder({ ...this.conf, required: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  number(): FlagBuilder<T extends any[] ? number[] : number> {
    return (new FlagBuilder({
      ...this.conf,
      type: FlagTypes.Number,
    }) as unknown) as FlagBuilder<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T extends any[] ? number[] : number
    >;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  boolean(): FlagBuilder<T extends any[] ? boolean[] : boolean> {
    return (new FlagBuilder({
      ...this.conf,
      type: FlagTypes.Boolean,
    }) as unknown) as FlagBuilder<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T extends any[] ? boolean[] : boolean
    >;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  string(): FlagBuilder<T extends any[] ? string[] : string> {
    return (new FlagBuilder({
      ...this.conf,
      type: FlagTypes.String,
    }) as unknown) as FlagBuilder<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T extends any[] ? string[] : string
    >;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  array(): FlagBuilder<T extends any[] ? T : T[]> {
    if (this.conf.array) {
      return (new FlagBuilder({
        ...this.conf,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as unknown) as FlagBuilder<T extends any[] ? T : T[]>;
    }
    return (new FlagBuilder({
      ...this.conf,
      array: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as unknown) as FlagBuilder<T extends any[] ? T : T[]>;
  }

  default(value: T): FlagBuilder<T> {
    return new FlagBuilder({ ...this.conf, defaultValue: value });
  }

  build() {
    if (!this.conf.name) {
      throw new Error(
        'The "name" attribute is required for a flag, but no name was specified',
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
    const builtConf: BuiltFlagConf<T> = {
      ...defaultFlagConf,
      ...this.conf,
    } as BuiltFlagConf<T>;
    return builtConf;
  }
}

export default FlagBuilder;
