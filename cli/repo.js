#!/usr/bin/env node

import { exec } from 'node:child_process';
import { changelog, clean, escheck } from '../index.js';

const args = process.argv.slice(2)
const argl = args.length;
const help = `
Usage: repo <Command> [option]

<Command>:
  - changelog         : generate CHANGELOG.md
  - clean             : clean node_modules and it's empty folders
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
      exec(`npx clean-modules -y`, (error, stdout) => {
        if(error) console.error(error);
        console.log(stdout)
        clean(`${cwd}/node_modules`);
      });
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
    console.log('copy paste necessary files from this module.\n')
    console.log('to generate build, copy paste "rollup.config.js".\ndependencies:')
    console.log('- rollup\n- @rollup/plugin-node-resolve\n- @rollup/plugin-commonjs\n- @rollup/plugin-babel\n- @babel/preset-env\n- @rollup/plugin-terser')
    console.log(`- scripts: { "build": "rollup -c" }\n`)
    console.log('to generate "d.ts":\n- copy paste "tsconfig.json"\n- install "typescript"')
    console.log(`- scripts: { "types": "tsc" }`)
  }
  else if( args[0] === 'prepare') {
    console.log('command:\n\tnpm publish --dry-run');
  }
  else {
    console.log(help);
  }
}


