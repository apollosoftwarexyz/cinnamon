import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import ts from 'rollup-plugin-ts';
import json from '@rollup/plugin-json';

import { DEFAULT_EXTENSIONS } from '@babel/core';

export default {
  input: './distributions/cinnamon/src/main.ts',
  output: {
    name: 'Cinnamon',
    exports: 'named',
    format: 'module',
    file: './distributions/cinnamon/dist/index.mjs',
    sourcemap: false
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true,
      extensions: [
        ...DEFAULT_EXTENSIONS,
        '.ts',
        '.tsx'
      ],
      customResolveOptions: {
        moduleDirectories: [
          "packages/*",
          "distributions/*"
        ],
      }
    }),
    commonjs(),
    json(),
    ts({
      tsconfig: './tsconfig.build.json',
      moduleResolution: 'node',
      transpiler: 'babel',
      babelConfig: {
        minified: true,
        compact: true,
        comments: false
      }
    })
  ]
};
