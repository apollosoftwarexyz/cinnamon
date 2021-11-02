import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import ts from 'rollup-plugin-ts';
import json from '@rollup/plugin-json';

import { DEFAULT_EXTENSIONS } from '@babel/core';

const isDev = process.env.NODE_ENV === 'development';

export default [
  {
    input: './distributions/cinnamon/src/index.ts',
    output: {
      name: 'Cinnamon',
      exports: 'named',
      format: 'cjs',
      file: './distributions/cinnamon/dist/index.cjs',
      sourcemap: isDev
    },
    plugins: [
      nodeResolve({
        exportConditions: ['node'],
        preferBuiltins: true,
        extensions: [
          ...DEFAULT_EXTENSIONS,
          '.ts',
          '.tsx'
        ],
        customResolveOptions: {
          moduleDirectories: [
            "packages/*"
          ],
        }
      }),
      commonjs({
        ignore: [
          '@mikro-orm/mariadb',
          '@mikro-orm/mongodb',
          '@mikro-orm/mysql',
          '@mikro-orm/postgresql',
          '@mikro-orm/sqlite'
        ],
        ignoreDynamicRequires: true
      }),
      json(),
      ts({
        tsconfig: './tsconfig.build.json',
        moduleResolution: 'node',
        transpiler: 'babel',
        babelConfig: isDev ? {
          minified: false,
          compact: false
        } : {
          minified: true,
          compact: true,
          comments: false
        }
      })
    ]
  }
];
