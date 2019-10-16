export function entries<V = any>(obj: {
  [k: string]: V;
}): [string, V][] {
  return Object.keys(obj).map(key => [key, obj[key]]);
}

export function fromEntries<V = any>(
  // eslint-disable-next-line no-shadow
  entries: [string, V][],
): { [k: string]: V } {
  return entries.reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value,
    }),
    {},
  );
}
