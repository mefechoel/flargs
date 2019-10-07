// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IsArrayElse<T, Then, Else> = T extends any[]
  ? Then
  : Else;
