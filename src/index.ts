import flargs from './builder';

function d(arg: any) {
  return JSON.stringify(arg, null, 2);
}

console.log(process.argv);

const x = flargs
  .flag()
  .name('version')
  .number()
  .shorthand('v')
  .default(0)
  ._build();

console.log(x);

const y = flargs
  .command()
  .name('asd')
  .flag(
    'flag',
    flargs
      .flag()
      .number()
      .default(0),
  )
  .description('desc')
  .alias('a');

console.log(d(y._build()));

const z = flargs.command().name('test');

console.log(z._build());

const a = flargs()
  .version('123')
  .name('asd')
  .description('desc')
  .flag(flargs.flag().name('flag'));

console.log(d(a._build()));

a.parse();
