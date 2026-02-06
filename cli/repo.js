#!/usr/bin/env node

import { exec } from 'node:child_process';
import { changelog, clean, escheck } from '../index.js';

const args = process.argv.slice(2)
const argl = args.length;
const help = `
Usage: repo <Command> [option]

<Command>:
  - changelog       : generate CHANGELOG.md
  - clean           : clean 'node_modules' and it's empty folders
  - escheck [files] : check sources files against ES5, separated by SPACE

Example:
  repo changelog
  repo clean
  repo escheck ./index.js ./src/main.js
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
  else {
    console.log(help);
  }
}


