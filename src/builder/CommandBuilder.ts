/* eslint-disable no-dupe-class-members */
import FlagBuilder, {
  flagBuilderSymbol,
  BuiltFlagConf,
  FlagValueType,
} from './FlagBuilder';
import ParamBuilder, {
  ParamValueType,
  paramBuilderSymbol,
  BuiltParamConf,
} from './ParamBuilder';
import parse from '../parser';

export interface Version {
  versionNumber: string;
  flagName: string;
}

export interface CommandConf {
  name?: string;
  aliases: string[];
  description?: string;
  flags: BuiltFlagConf[];
  params: BuiltParamConf[];
  version?: Version;
}

export interface BuiltCommandConf extends CommandConf {
  name: string;
}

function isFlagBuilder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maybeFlagBuilder: FlagBuilder<FlagValueType> | any,
): maybeFlagBuilder is FlagBuilder<FlagValueType> {
  return !!(maybeFlagBuilder && maybeFlagBuilder[flagBuilderSymbol]);
}

function isParamBuilder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maybeParamBuilder: ParamBuilder<ParamValueType> | any,
): maybeParamBuilder is ParamBuilder<ParamValueType> {
  return !!(
    maybeParamBuilder && maybeParamBuilder[paramBuilderSymbol]
  );
}

function invalidFlagError() {
  return new Error(
    'Invalid params for .flag() method. ' +
      'Please specify a flag builder or a name and a flag builder.',
  );
}

class CommandBuilder {
  private _conf: CommandConf;

  constructor(
    conf: CommandConf = { aliases: [], flags: [], params: [] },
  ) {
    this._conf = conf;
  }

  parse() {
    return parse({ config: this._build() });
  }

  name(name: string): CommandBuilder {
    return this._configure({ name });
  }

  alias(alias: string): CommandBuilder {
    const aliases = [...this._conf.aliases, alias];
    return this._configure({ aliases });
  }

  description(description: string): CommandBuilder {
    return this._configure({ description });
  }

  version(
    versionNumber: string,
    flagBuilder?: FlagBuilder,
  ): CommandBuilder {
    if (flagBuilder && !isFlagBuilder(flagBuilder)) {
      throw invalidFlagError();
    }
    const flag =
      flagBuilder ||
      new FlagBuilder()
        .name('version')
        .shorthand('v')
        .description('Print the version number of the programm.')
        .boolean();
    const command = this.flag(flag)._configure({
      version: { versionNumber, flagName: flag._build().name },
    });
    return command;
  }

  flag(flag: FlagBuilder<FlagValueType>): CommandBuilder;

  flag(
    name: string,
    flag: FlagBuilder<FlagValueType>,
  ): CommandBuilder;

  flag(
    flagOrName: FlagBuilder<FlagValueType> | string,
    flagBuilder?: FlagBuilder<FlagValueType>,
  ): CommandBuilder {
    if (isFlagBuilder(flagOrName)) {
      const flag = flagOrName;
      return this._addFlag(flag);
    }
    if (
      typeof flagOrName === 'string' &&
      isFlagBuilder(flagBuilder)
    ) {
      const name = flagOrName;
      const flag = flagBuilder.name(name);
      return this._addFlag(flag);
    }
    throw invalidFlagError();
  }

  private _addFlag(
    flagBuilder: FlagBuilder<FlagValueType>,
  ): CommandBuilder {
    const flags = [...this._conf.flags, flagBuilder._build()];
    return this._configure({ flags });
  }

  param(param: ParamBuilder<ParamValueType>): CommandBuilder;

  param(
    name: string,
    param: ParamBuilder<ParamValueType>,
  ): CommandBuilder;

  param(
    paramOrName: ParamBuilder<ParamValueType> | string,
    paramBuilder?: ParamBuilder<ParamValueType>,
  ): CommandBuilder {
    if (isParamBuilder(paramOrName)) {
      const param = paramOrName;
      return this._addParam(param);
    }
    if (
      typeof paramOrName === 'string' &&
      isParamBuilder(paramBuilder)
    ) {
      const name = paramOrName;
      const param = paramBuilder.name(name);
      return this._addParam(param);
    }
    throw new Error(
      'Invalid params for .param() method. ' +
        'Please specify a param builder or a name and a param builder.',
    );
  }

  private _addParam(
    paramBuilder: ParamBuilder<ParamValueType>,
  ): CommandBuilder {
    const param = paramBuilder._build();
    const prevParam = this._conf.params[this._conf.params.length - 1];
    if (prevParam && prevParam.array) {
      throw new Error(
        'There cannot be any param after an array param. ' +
          `The param "${prevParam.name}" is an array param. ` +
          `Consider moving the param "${param.name}" before "${prevParam.name}".`,
      );
    }
    if (prevParam && !prevParam.required && param.required) {
      throw new Error(
        'There cannot be a required param after a non-required param. ' +
          `The param "${prevParam.name}" is not required, ` +
          `but "${param.name}" is.` +
          `Consider moving the param "${param.name}" before "${prevParam.name}".`,
      );
    }
    const params = [...this._conf.params, param];
    return this._configure({ params });
  }

  _build(): BuiltCommandConf {
    if (!this._conf.name) {
      throw new Error(
        'The "name" attribute is required for a command, ' +
          'but no name was specified. ' +
          'You can set a name by calling .name() on the command builder.',
      );
    }
    const builtConf = {
      ...this._conf,
    };
    return builtConf as BuiltCommandConf;
  }

  private _configure(config: Partial<CommandConf>): CommandBuilder {
    return new CommandBuilder({
      ...this._conf,
      ...config,
    });
  }
}

export default CommandBuilder;
