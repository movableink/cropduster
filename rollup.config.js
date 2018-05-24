import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default {
  input: 'src/cropduster.js',

  plugins: [babel({
    babelrc: false,
    presets: [
      ['env',
        {
          modules: false
        }
      ]
    ]
  })],

  output: [
    {
      file: pkg.module,
      format: 'es'
    }
  ]
}
