import flargs from './builder';

function d(arg: any) {
  console.log(JSON.stringify(arg, null, 2));
}

const a = flargs()
  .version('123')
  .name('aaa')
  .description('desc')
  .command(
    'bbb',
    flargs.command().param('path', flargs.param().array()),
  )
  .command(
    'ccc',
    flargs
      .command()
      .param('port', flargs.param().number())
      .flag(flargs.flag('cfl').shorthand('l'))
      .command(
        flargs
          .command('ccc-aaa')
          .alias('ca')
          .flag(
            flargs
              .flag('xxx')
              .shorthand('x')
              .boolean(),
          )
          .flag(
            flargs
              .flag('yyy')
              .shorthand('y')
              .number()
              .array(),
          )
          .flag(
            flargs
              .flag('array')
              .array()
              .default(['a', 'b', 'c']),
          )
          .flag(
            flargs
              .flag('opt')
              .shorthand('0')
              .number()
              .default(1),
          )
          .flag(flargs.flag('zzz').shorthand('z')),
      ),
  )
  .flag(flargs.flag().name('flag'))
  .flag(
    flargs
      .flag('opt')
      .shorthand('0')
      .number()
      .default(2),
  );

const map = a.parse();
d(map);

d(a._build());
