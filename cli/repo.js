#!/usr/bin/env node

import { exec, execSync } from 'node:child_process';
import { changelog, clean, escheck } from '../index.js';

const args = process.argv.slice(2)
const argl = args.length;
const help = `
Usage: repo <Command> [option]

<Command>:
  - changelog         : generate CHANGELOG.md
  - clean             : clean node_modules empty folders
  - escheck [files]   : check sources files against ES5, separated by SPACE
  - generate          : generate project files
  - prepare           : check current project status for publish
  - server            : install @web/dev-server

Example:
  repo changelog
  repo clean
  repo escheck ./index.js ./src/main.js
  repo server
  repo generate
  repo prepare
`
const cwd = process.cwd();

if(argl === 0) {
  console.log(help)
} else {
  if( (args[0] === '-h') || (args[0] === '--help') ) {
    console.log(help);
  }
  else if(args[0] === 'changelog') {
    const json = await import(`${cwd}/package.json`, { with: { type: 'json' }});
    const pkg = json.default;
    try {
      changelog(pkg.homepage)
    }
    catch(e) {
      console.error(e)
    }
  }
  else if (args[0] === 'clean') {
    try {
      console.log('clean empty folder in node_modules ...');
      clean(`${cwd}/node_modules`);
    }
    catch(e) {
      console.error(e)
    }
  }
  else if( args[0] === 'escheck') {
    try {
      args.shift();
      escheck(args)
    }
    catch(e) {
      console.error(e)
    }
  }
  else if( args[0] === 'server') {
    console.log('command:\n\tnpm i @web/dev-server')
    console.log(`scripts:\n\t{ "server": "web-dev-server" }`)
    console.log(`help:\n\t npx web-dev-server --help`)
  }
  else if (args[0] === 'generate') {
    execSync(`cat ${cwd}/node_modules/@jlongyam/repo/src/tpl/editorconfig.txt > .editorconfig`);
    execSync(`cat ${cwd}/node_modules/@jlongyam/repo/src/tpl/gitattributes.txt > .gitattributes`);
    execSync(`cat ${cwd}/node_modules/@jlongyam/repo/src/tpl/gitignore.txt > .gitignore`);
    execSync(`cat ${cwd}/node_modules/@jlongyam/repo/src/tpl/npmrc.txt > .npmrc`);
    execSync(`cat ${cwd}/node_modules/@jlongyam/repo/src/tpl/rollup.config.js.txt > rollup.config.js`);
    execSync(`cat ${cwd}/node_modules/@jlongyam/repo/src/tpl/tsconfig.json.txt > tsconfig.json`);
    console.log('\nto generate build install:')
    console.log('- rollup\n- @rollup/plugin-node-resolve\n- @rollup/plugin-commonjs\n- @rollup/plugin-babel\n- @rollup/plugin-terser\n- @babel/preset-env');
    console.log('\nconfigure rollup.config.js and config.json:');
    console.log(`\nscripts: { "build": "rollup -c" }\n`)
    console.log('to generate file d.ts install:');
    console.log('-  typescript');
    console.log('\nconfigure tsconfig.json and config.json:')
    console.log(`\nscripts: { "types": "tsc" }`)
  }
  else if( args[0] === 'prepare') {
    console.log('run this command:\n\tnpm publish --dry-run');
  }
  else {
    console.log(help);
  }
}


