export type ValueType = number | string | boolean;
export type ValueArrayType = number[] | string[] | boolean[];

export enum InputTypes {
  Number = 'number',
  String = 'string',
  Boolean = 'boolean',
}

export type InputValueType = ValueType | ValueArrayType;

// eslint-disable-next-line no-shadow
function name(name: string) {
  return { name };
}

// eslint-disable-next-line no-shadow
function shorthand(shorthand: string) {
  return { shorthand };
}

// eslint-disable-next-line no-shadow
function description(description: string) {
  return { description };
}

function required() {
  return { required: true };
}

function number() {
  return { type: InputTypes.Number };
}

function string() {
  return { type: InputTypes.String };
}

function boolean() {
  return { type: InputTypes.Boolean };
}

function array() {
  return { array: true };
}
function createDefault<T>() {
  return (value: T) => ({ defaultValue: value });
}

const builderFns = {
  name,
  shorthand,
  description,
  required,
  number,
  string,
  boolean,
  array,
  createDefault,
};

export default builderFns;
