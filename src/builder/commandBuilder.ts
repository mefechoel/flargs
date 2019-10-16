import createFlagBuilder, {
  FlagBuilder,
  flagBuilderSymbol,
  BuiltFlagConf,
} from './flagBuilder';
import {
  ParamBuilder,
  ParamValueType,
  paramBuilderSymbol,
  BuiltParamConf,
} from './paramBuilder';
import parse, { ParseMap } from '../parser';
import builderFns, { InputValueType } from './builderFns';
import {
  createConfigurator,
  bindFactory,
  ConfigureFn,
} from './builder';

export interface Version {
  versionNumber: string;
  flagName: string;
}

export const commandBuilderSymbol = Symbol('CommandBuilder');

export interface CommandConf {
  name?: string;
  aliases: string[];
  description?: string;
  commands: BuiltCommandConf[];
  flags: BuiltFlagConf[];
  params: BuiltParamConf[];
  version?: Version;
}

export interface BuiltCommandConf extends CommandConf {
  name: string;
}

function isFlagBuilder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maybeFlagBuilder: FlagBuilder<InputValueType> | any,
): maybeFlagBuilder is FlagBuilder<InputValueType> {
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

function isCommandBuilder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maybeCommandBuilder: CommandBuilder | any,
): maybeCommandBuilder is CommandBuilder {
  return !!(
    maybeCommandBuilder && maybeCommandBuilder[commandBuilderSymbol]
  );
}

function invalidFlagError() {
  return new Error(
    'Invalid params for .flag() method. ' +
      'Please specify a flag builder or a name and a flag builder.',
  );
}

interface FlagFn<T> {
  (flag: FlagBuilder<T>): CommandBuilder;
  (name: string, flag: FlagBuilder<T>): CommandBuilder;
}

export interface CommandBuilder {
  name: (name: string) => CommandBuilder;
  alias: (alias: string) => CommandBuilder;
  description: (description: string) => CommandBuilder;
  command: {
    (command: CommandBuilder): CommandBuilder;
    (name: string, command: CommandBuilder): CommandBuilder;
  };
  flag: {
    <FlagT>(flag: FlagBuilder<FlagT>): CommandBuilder;
    <FlagT>(name: string, flag: FlagBuilder<FlagT>): CommandBuilder;
  };
  param: {
    <ParamT>(param: ParamBuilder<ParamT>): CommandBuilder;
    <ParamT>(
      name: string,
      param: ParamBuilder<ParamT>,
    ): CommandBuilder;
  };
  version(
    versionNumber: string,
    flagBuilder?: FlagBuilder,
  ): CommandBuilder;
  parse(): ParseMap;
  _build: () => BuiltCommandConf;
  [commandBuilderSymbol]: boolean;
}

function createNextCommands(
  commandBuilder: CommandBuilder,
  conf: CommandConf,
) {
  const commands = [...conf.commands, commandBuilder._build()];
  return { commands };
}

function createNextFlags(
  flagBuilder: FlagBuilder<InputValueType>,
  conf: CommandConf,
) {
  const flags = [...conf.flags, flagBuilder._build()];
  return { flags };
}

function createNextParams(
  paramBuilder: ParamBuilder<ParamValueType>,
  conf: CommandConf,
) {
  const param = paramBuilder._build();
  const prevParam = conf.params[conf.params.length - 1];
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
  const params = [...conf.params, param];
  return { params };
}

function createConfigBuilder() {
  return {
    name: builderFns.name,
    description: builderFns.description,
    alias: (alias: string) => (conf: CommandConf) => {
      const aliases = [...conf.aliases, alias];
      return { aliases };
    },
    command: (
      commandOrName: CommandBuilder | string,
      commandBuilder?: CommandBuilder,
    ) => (conf: CommandConf) => {
      if (isCommandBuilder(commandOrName)) {
        return createNextCommands(commandOrName, conf);
      }
      if (
        typeof commandOrName === 'string' &&
        isCommandBuilder(commandBuilder)
      ) {
        const name = commandOrName;
        const builder = commandBuilder.name(name);
        return createNextCommands(builder, conf);
      }
      throw new Error(
        'Invalid commands for .command() method. ' +
          'Please specify a command builder or a name and a command builder.',
      );
    },
    flag: (
      flagOrName: FlagBuilder<InputValueType> | string,
      flagBuilder?: FlagBuilder<InputValueType>,
    ) => (conf: CommandConf) => {
      if (isFlagBuilder(flagOrName)) {
        return createNextFlags(flagOrName, conf);
      }
      if (
        typeof flagOrName === 'string' &&
        isFlagBuilder(flagBuilder)
      ) {
        const name = flagOrName;
        const builder = flagBuilder.name(name);
        return createNextFlags(builder, conf);
      }
      throw invalidFlagError();
    },
    param: (
      paramOrName: ParamBuilder<ParamValueType> | string,
      paramBuilder?: ParamBuilder<ParamValueType>,
    ) => (conf: CommandConf) => {
      if (isParamBuilder(paramOrName)) {
        const param = paramOrName;
        return createNextParams(param, conf);
      }
      if (
        typeof paramOrName === 'string' &&
        isParamBuilder(paramBuilder)
      ) {
        const name = paramOrName;
        const param = paramBuilder.name(name);
        return createNextParams(param, conf);
      }
      throw new Error(
        'Invalid params for .param() method. ' +
          'Please specify a param builder or a name and a param builder.',
      );
    },
  };
}

function createVersion(
  configure: ConfigureFn<CommandConf>,
  builderFn: (conf: CommandConf) => CommandBuilder,
) {
  const version = (
    versionNumber: string,
    flagBuilder?: FlagBuilder,
  ): CommandBuilder => {
    if (flagBuilder && !isFlagBuilder(flagBuilder)) {
      throw invalidFlagError();
    }
    const flag =
      flagBuilder ||
      createFlagBuilder()
        .name('version')
        .shorthand('v')
        .description('Print the version number of the programm.')
        .boolean();
    const command = configure({
      version: { versionNumber, flagName: flag._build().name },
    });
    return builderFn(command).flag(flag as FlagBuilder<
      InputValueType
    >);
  };
  return version;
}

function createBuild(conf: CommandConf) {
  const _build = () => {
    if (!conf.name) {
      throw new Error(
        'The "name" attribute is required for a command, ' +
          'but no name was specified. ' +
          'You can set a name by calling .name() on the command builder.',
      );
    }
    const builtConf = { ...conf };
    return builtConf as BuiltCommandConf;
  };
  return _build;
}

function createCommandBuilder(
  conf: CommandConf = {
    aliases: [],
    flags: [],
    params: [],
    commands: [],
  },
): CommandBuilder {
  const configure = createConfigurator(conf);
  const configBuilder = createConfigBuilder();
  const boundBuilderFns = bindFactory(
    createCommandBuilder,
    configure,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  )(configBuilder as any);
  const _build = createBuild(conf);
  const parseFn = () => parse({ schema: _build() });
  const builder = {
    ...boundBuilderFns,
    _build,
    parse: parseFn,
    version: createVersion(configure, createCommandBuilder),
    [commandBuilderSymbol]: true,
  };
  return builder as CommandBuilder;
}

export default createCommandBuilder;
