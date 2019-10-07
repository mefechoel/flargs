import { BuiltCommandConf } from '../builder/CommandBuilder';

interface ParseOptions {
  config: BuiltCommandConf;
  args?: string[];
}

function parse({ config, args = process.argv }: ParseOptions) {
  console.log(args);
}

export default parse;
