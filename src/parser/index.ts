import { BuiltCommandConf } from '../builder/CommandBuilder';
import {
  BuiltFlagConf,
  FlagValueType,
  FlagTypes,
  ValueArrayType,
} from '../builder/FlagBuilder';

export interface ParserOptions {
  schema: BuiltCommandConf;
  args?: string[];
}

export interface SubParseMap {
  [key: string]: FlagValueType | SubParseMap;
}

export interface ParseOptions {
  [key: string]: FlagValueType;
}

export interface ParseMap {
  program: SubParseMap;
  _: ParseOptions;
}

export interface ParseQueueItem {
  name: string;
  _: ParseOptions;
}

export enum ArgType {
  CommandOrPlain = 'CommandOrPlain',
  Plain = 'Plain',
  Flag = 'Flag',
  FlagShorthand = 'FlagShorthand',
}

export enum State {
  Command = 'Command',
  Flag = 'Flag',
  Param = 'Param',
  ArrayParam = 'ArrayParam',
}

const defaultArgs = process.argv.slice(2);

const flagRg = /^--\w/;
const flagShorthandRg = /^-\w/;
const commandOrPlainRg = /^[\w_]+[\w_-]*[\w_]$/;

function argType(arg: string): ArgType {
  if (flagRg.test(arg)) return ArgType.Flag;
  if (flagShorthandRg.test(arg)) return ArgType.FlagShorthand;
  if (commandOrPlainRg.test(arg)) return ArgType.CommandOrPlain;
  return ArgType.Plain;
}

function lastItem<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

function firstItem<T>(arr: T[]): T | undefined {
  return arr[0];
}

function findNextCommand(
  cmd: string,
  schema?: BuiltCommandConf,
): BuiltCommandConf | undefined {
  return ((schema && schema.commands) || []).find(
    ({ name, aliases }) =>
      name === cmd || aliases.some(alias => alias === cmd),
  );
}

function findNextFromQueue(
  cmd: string,
  cmdQueue: BuiltCommandConf[],
): BuiltCommandConf | undefined {
  const schema = firstItem(cmdQueue);
  const next = findNextCommand(cmd, schema);
  return next;
}

function stripLeadingDashes(str: string): string {
  return str.replace(/^--?/, '');
}

function findFlag(
  flag: string,
  cmdQueue: BuiltCommandConf[],
): BuiltFlagConf<FlagValueType> | undefined {
  const flagQueue = cmdQueue.map(schema =>
    ((schema && schema.flags) || []).find(({ name, shorthand }) => {
      return name === flag || shorthand === flag;
    }),
  );
  return firstItem(flagQueue);
}

function fillDefaults(
  parseQueue: ParseQueueItem[],
  commandQueue: BuiltCommandConf[],
): ParseQueueItem[] {
  return parseQueue.map((parseOptions, i) => ({
    name: parseOptions.name,
    _: {
      ...commandQueue[i].flags
        .filter(f => f.defaultValue !== undefined)
        .reduce(
          (innerAcc, f) => ({
            ...innerAcc,
            [f.name]: f.defaultValue,
          }),
          {},
        ),
      ...parseOptions._,
    },
  }));
}

function createParseMap(
  parseQueue: ParseQueueItem[],
  commandQueue: BuiltCommandConf[],
): ParseMap {
  const filledParseQueue = fillDefaults(parseQueue, commandQueue);
  const programMap: SubParseMap = filledParseQueue.reduce(
    (acc, parseOptions) => ({
      [parseOptions.name]: {
        ...acc,
        _: {
          ...parseOptions._,
        },
      },
    }),
    {},
  );
  const optionsMap: ParseOptions = filledParseQueue.reduceRight(
    (acc, parseOption) => ({
      ...acc,
      ...parseOption._,
    }),
    {},
  );
  return { program: programMap, _: optionsMap };
}

function getFlagValue(
  flag: BuiltFlagConf<FlagValueType>,
  val: string,
): FlagValueType {
  switch (flag.type) {
    case FlagTypes.Boolean: {
      if (val === 'true') return true;
      if (val === 'false') return false;
      throw new Error(
        `Unsupported value for Flag "${flag.name}" of type ${flag.type}: ` +
          `Expected "true" or "false", got "${val}"`,
      );
    }
    case FlagTypes.Number: {
      const numVal = Number(val);
      if (Number.isNaN(numVal)) {
        throw new Error(
          `Unsupported value for Flag "${flag.name}" of type ${flag.type}: ` +
            ` "${val}"`,
        );
      }
      return numVal;
    }
    case FlagTypes.String:
    default: {
      return val;
    }
  }
}

function parse({
  schema,
  args = defaultArgs,
}: ParserOptions): ParseMap {
  const commandQueue: BuiltCommandConf[] = [schema];
  const parseQueue: ParseQueueItem[] = [{ name: schema.name, _: {} }];
  let state: State | null = null;
  let flag: BuiltFlagConf<FlagValueType> | null = null;

  type SetValue = (prevValue: FlagValueType) => FlagValueType;
  const setMap = (key: string, value: FlagValueType | SetValue) => {
    const nextValue =
      typeof value === 'function'
        ? value(parseQueue[0]._[key])
        : value;
    parseQueue[0] = {
      ...parseQueue[0],
      _: {
        ...parseQueue[0]._,
        [key]: nextValue,
      },
    };
  };

  args.forEach(arg => {
    switch (argType(arg)) {
      case ArgType.FlagShorthand:
      case ArgType.Flag: {
        const flagName = stripLeadingDashes(arg);
        const nextFlag = findFlag(flagName, commandQueue);
        if (!nextFlag) {
          const commandPath = commandQueue
            .reverse()
            .map(cmd => cmd.name)
            .join('.');
          throw new Error(
            `Flag "${arg}" could not be found in ${commandPath}`,
          );
        }
        if (nextFlag.type === FlagTypes.Boolean) {
          setMap(nextFlag.name, true);
        }
        state = State.Flag;
        flag = nextFlag;
        break;
      }
      default:
      case ArgType.CommandOrPlain: {
        const next = findNextFromQueue(arg, commandQueue);
        if (next) {
          commandQueue.unshift(next);
          parseQueue.unshift({ name: next.name, _: {} });
          state = State.Command;
          break;
        }
        if (state === State.Flag && flag) {
          const value = getFlagValue(flag, arg);
          if (flag.array) {
            setMap(flag.name, prevValue => {
              const arrayValue = [
                ...((prevValue as ValueArrayType) || []),
                value,
              ] as FlagValueType;
              return arrayValue;
            });
            break;
          }
          setMap(flag.name, value);
        }
        break;
      }
    }
  });

  const parseMap = createParseMap(parseQueue, commandQueue);
  return parseMap;
}

export default parse;
