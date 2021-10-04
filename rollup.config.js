import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import ts from 'rollup-plugin-ts';
import json from '@rollup/plugin-json';

import { DEFAULT_EXTENSIONS } from '@babel/core';

export default {
  input: './distributions/cinnamon/src/index.ts',
  output: {
    name: 'Cinnamon',
    exports: 'named',
    format: 'cjs',
    file: './distributions/cinnamon/dist/index.cjs',
    sourcemap: true
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