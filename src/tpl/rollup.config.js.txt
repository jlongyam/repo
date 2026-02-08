import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import pkg from './package.json' with { type: 'json' }

//-- auto-generate --//
const year = new Date().getFullYear();
const banner = `
  /*!
  * ${pkg.name} - ${pkg.description}
  * Version ${pkg.version}
  * Author: ${pkg.author}
  * ${pkg.homepage}/${pkg.repository.directory}
  * MIT License - ${year}
  */
  `
//-- manual-config --//
const strict = false;
const plugins = [
  commonjs(),
  resolve(),
  babel({
    babelHelpers: 'bundled',
    presets: [["@babel/preset-env", {
      targets: "> 0.25%, last 2 versions, Firefox ESR, not dead, node 5.12.0, chrome 50"
    }]]
  })
];
export default (arg) => {
  let minify = arg['config-minify'] ? true : false;
  let mod = pkg.type === 'module' ? 'js' : 'mjs'
  //-- manual-config --//
  const path_in = './src';
  const path_out = `./dist`;
  const format = ['es'];
  // lib { <file_name>: <export_name> }
  const lib = {
    changelog: "changelog",
    clean: "clean",
    escheck: "escheck"
  };
  const terser_ = [
    terser({
      compress: {
        dead_code: true,
        unused: true,
        passes: 2,
        drop_console: false,
        ecma: 2015
      },
      mangle: minify ? true : false,
      format: {
        comments: false,
        beautify: minify ? false : true,
        indent_level: minify ? 0 : 2
      }
    })
  ]
  //-- auto-generate --//
  let output = {};
  let lib_keys = Object.keys(lib);
  for (let i = 0; i < lib_keys.length; i++) { output[lib_keys[i]] = [] }
  for (let i = 0; i < format.length; i++) {
    let output_keys = Object.keys(output);
    for(let a = 0; a < output_keys.length; a++ ) {
      output[output_keys[a]].push({
        format: format[i],
        name: lib[output_keys[a]],
        banner: banner,
        strict: strict,
        file: minify
          ? `${path_out}/${format[i]}/${lib[output_keys[a]]}.min.js`
          : `${path_out}/${format[i]}/${lib[output_keys[a]]}.js`,
        plugins: terser_
      })
    }
  }
  let return_ = [];
  for (let i = 0; i < lib_keys.length; i++) {
    return_.push({
      input: `${path_in}/${lib_keys[i]}.${mod}`,
      output: output[lib_keys[i]],
      plugins: plugins,
      external: ['child_process']
    })
  }
  return return_;
}
