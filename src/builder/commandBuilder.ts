interface CommandConf {
  name?: string;
  aliases: string[];
  description?: string;
}

interface BuiltCommandConf extends CommandConf {
  name: string;
}

interface CommandBuilder {
  name: (name: string) => CommandBuilder;
  alias: (aliasName: string) => CommandBuilder;
  description: (description: string) => CommandBuilder;
  build: () => BuiltCommandConf;
}

function createCommandBuilder(
  conf: CommandConf = { aliases: [] },
): CommandBuilder {
  // eslint-disable-next-line no-shadow
  function name(name: string) {
    return createCommandBuilder({ ...conf, name });
  }

  // eslint-disable-next-line no-shadow
  function alias(alias: string) {
    return createCommandBuilder({
      ...conf,
      aliases: [...conf.aliases, alias],
    });
  }

  // eslint-disable-next-line no-shadow
  function description(description: string) {
    return createCommandBuilder({ ...conf, description });
  }

  function build() {
    if (!conf.name) {
      throw new Error(
        'The "name" attribute is required for a command, but no name was specified',
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
    const builtConf: BuiltCommandConf = {
      ...conf,
    } as BuiltCommandConf;
    return builtConf;
  }

  return {
    name,
    alias,
    description,
    build,
  };
}
